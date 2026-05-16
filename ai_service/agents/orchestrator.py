import os
import re
import json
import asyncio
import tempfile
import time
from typing import Optional, List, TypedDict

import google.genai as genai
import boto3
import httpx
import redis.asyncio as redis
from botocore.client import Config
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langgraph.graph import StateGraph, END

from providers import get_provider


def extract_json_from_text(text: str) -> dict:
    """Attempt to extract a JSON object from raw LLM output.
    Works for models like tinyllama that may wrap JSON in prose."""
    if isinstance(text, dict):
        return text
    raw = str(text).strip()

    # 1. Try a direct JSON parse (best case — model output is clean)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # 2. Try to find a JSON block between ```json ... ``` or ```...```
    fence_match = re.search(r'```(?:json)?\s*({.*?})\s*```', raw, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    # 3. Find the first { ... } block spanning the whole depth
    brace_match = re.search(r'(\{.*\})', raw, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(1))
        except json.JSONDecodeError:
            pass

    # 4. Nothing parseable — return empty dict so caller can use fallback
    return {}

# --- Configuration ---
DEFAULT_GOOGLE_API_KEY = os.getenv("DEMO_GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
AI_PROVIDER_NAME = os.getenv("AI_PROVIDER", "gemini")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
API_URL = os.getenv("API_URL", "http://localhost:8080")
INTERNAL_SERVICE_KEY = os.getenv("INTERNAL_SERVICE_KEY", "briefly_internal_secret_key")

# S3 / MinIO Configuration
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "localhost:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "briefly_admin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "briefly_storage_secret")

s3_client = boto3.client(
    's3',
    endpoint_url=f"http://{S3_ENDPOINT}",
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    config=Config(signature_version='s3v4'),
    region_name='us-east-1'
)

async def get_redis_client():
    return await redis.from_url(REDIS_URL)

class Goal(TypedDict):
    title: str
    detail: str

class Ambiguity(TypedDict):
    field_missing: str
    reason: str
    suggested_question: str

class IntakeState(TypedDict):
    intake_id: str
    type: str
    raw_text: Optional[str]
    audio_url: Optional[str]
    image_url: Optional[str]
    transcription: Optional[str]
    ocr_text: Optional[str]
    unified_context: str
    summary: str
    goals: Optional[List[Goal]]
    success_criteria: Optional[List[str]]
    constraints: Optional[List[str]]
    ambiguities: Optional[List[Ambiguity]]
    followup_questions: Optional[List[str]]
    confidence_score: float
    tone_profile: str
    retry_count: int
    gemini_api_key: Optional[str]
    provider_name: str

# --- Node Functions ---

def apply_fallback_analysis(state: IntakeState) -> None:
    context = (state.get("unified_context") or "the submitted project context").replace("USER TEXT:", "").strip()
    short_context = context[:220] + ("..." if len(context) > 220 else "")
    state["summary"] = f"Draft brief generated from the submitted intake: {short_context}"
    state["goals"] = [
        {"title": "Clarify scope", "detail": "Turn the submitted context into agreed deliverables, owners, and acceptance criteria."},
        {"title": "Plan execution", "detail": "Define the timeline, dependencies, and milestones needed to move the project forward."},
        {"title": "Measure success", "detail": "Choose practical metrics that show whether the finished work meets the client need."},
    ]
    state["success_criteria"] = [
        "Stakeholders approve the brief and scope before production starts.",
        "Delivery milestones are mapped to target dates and responsible owners.",
        "Risks and open questions are resolved or explicitly accepted.",
    ]
    state["constraints"] = [
        "Timeline and budget require confirmation from the project owner.",
        "Any technical integrations should be validated before final commitment.",
        "Provider-generated analysis can be re-run when the AI provider is available.",
    ]


def apply_fallback_ambiguity(state: IntakeState) -> None:
    state["ambiguities"] = [
        {
            "field_missing": "Budget",
            "reason": "The intake does not provide an approved budget range.",
            "suggested_question": "What budget range should the team plan around?",
        },
        {
            "field_missing": "Timeline",
            "reason": "The target launch or delivery date needs confirmation.",
            "suggested_question": "What date should the first usable version be ready?",
        },
        {
            "field_missing": "Decision maker",
            "reason": "Final approval ownership is not explicit.",
            "suggested_question": "Who signs off on scope and final delivery?",
        },
    ]
    state["followup_questions"] = [
        "What budget range should guide the project plan?",
        "What is the target launch or delivery date?",
        "Who is responsible for final approval?",
    ]

async def node_ingest(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Ingest - Starting pipeline (provider={AI_PROVIDER_NAME})")
    return state

async def process_media_with_gemini(file_path: str, mime_type: str, prompt: str, api_key: str = None) -> str:
    """Upload a media file to Gemini Files API and get a response. Uses google.genai SDK directly."""
    key = api_key or DEFAULT_GOOGLE_API_KEY
    client = genai.Client(api_key=key)
    try:
        print(f"  Uploading media to Gemini Files API...")
        with open(file_path, "rb") as f:
            upload_response = client.files.upload(file=f, config={"mime_type": mime_type})
        file_handle = upload_response
        print(f"  Uploaded: {file_handle.name}")

        while file_handle.state.name == "PROCESSING":
            print(".", end="", flush=True)
            time.sleep(2)
            file_handle = client.files.get(name=file_handle.name)
        print()

        if file_handle.state.name == "FAILED":
            raise ValueError(f"Gemini file processing failed: {file_handle.name}")

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[file_handle, prompt]
        )
        client.files.delete(name=file_handle.name)
        return response.text
    except Exception as e:
        print(f"  Media Processing Error: {e}")
        return f"[Media Processing Error: {str(e)}]"

async def node_transcribe(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Transcribe")
    if not state.get("audio_url"):
        state["transcription"] = ""
        return state
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as tmp:
            bucket = "briefly-intake"
            key = state["audio_url"].split("/")[-1]
            s3_client.download_file(bucket, key, tmp.name)
            mime_type = "audio/mpeg"
            if key.endswith(".wav"): mime_type = "audio/wav"
            elif key.endswith(".mp4"): mime_type = "video/mp4"
            prompt = "Provide a verbatim transcription of this audio. If it is a video, transcribe the spoken parts."
            state["transcription"] = await process_media_with_gemini(tmp.name, mime_type, prompt, state.get("gemini_api_key"))
            os.unlink(tmp.name)
    except Exception as e:
        print(f"[{state['intake_id']}] Transcription Error: {e}")
        state["transcription"] = f"[Error: {str(e)}]"
    return state

async def node_vision(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Vision")
    if not state.get("image_url"):
        state["ocr_text"] = ""
        return state
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".img") as tmp:
            bucket = "briefly-intake"
            key = state["image_url"].split("/")[-1]
            s3_client.download_file(bucket, key, tmp.name)
            mime_type = "image/jpeg"
            if key.endswith(".png"): mime_type = "image/png"
            prompt = "Describe everything in this image in detail, extracting all visible text."
            state["ocr_text"] = await process_media_with_gemini(tmp.name, mime_type, prompt, state.get("gemini_api_key"))
            os.unlink(tmp.name)
    except Exception as e:
        print(f"[{state['intake_id']}] Vision Error: {e}")
        state["ocr_text"] = f"[Error: {str(e)}]"
    return state

async def node_transcribe_and_vision(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Transcribe+Vision")
    state = await node_transcribe(state)
    state = await node_vision(state)
    return state

async def node_merge(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Merge")
    parts = []
    if state.get("raw_text"):
        parts.append(f"USER TEXT: {state['raw_text']}")
    if state.get("transcription"):
        parts.append(f"MEDIA TRANSCRIPT: {state['transcription']}")
    if state.get("ocr_text"):
        parts.append(f"IMAGE CONTENT: {state['ocr_text']}")
    state["unified_context"] = "\n\n".join(parts)
    return state

async def node_analyze(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Analyze")
    if AI_PROVIDER_NAME in ("fallback", "offline"):
        apply_fallback_analysis(state)
        state["provider_name"] = "Fallback/Offline"
        return state

    provider = get_provider(state.get("gemini_api_key"))
    # Use StrOutputParser for robustness — tinyllama may not output clean JSON
    str_parser = StrOutputParser()
    prompt = ChatPromptTemplate.from_template("""
Extract a project brief as JSON from the context below. Replace all values with real content from the context.

CONTEXT: {context}

Respond with ONLY valid JSON in this exact structure (fill every value based on the CONTEXT above):
{{"summary": "<write a 2-sentence executive summary of the project>",
  "goals": [
    {{"title": "<first goal title>", "detail": "<one sentence describing this goal>"}},
    {{"title": "<second goal title>", "detail": "<one sentence describing this goal>"}},
    {{"title": "<third goal title>", "detail": "<one sentence describing this goal>"}}
  ],
  "success_criteria": ["<measurable KPI 1>", "<measurable KPI 2>", "<measurable KPI 3>"],
  "constraints": ["<budget or time constraint>", "<technical constraint>", "<scope or resource constraint>"]}}
""")

    async def _invoke(p):
        llm = p.get_llm()
        chain = prompt | llm | str_parser
        raw = await p.invoke_with_backoff(chain, {"context": state["unified_context"]})
        return extract_json_from_text(raw)

    try:
        res = await _invoke(provider)
        active = getattr(provider, "active_name", type(provider).__name__.replace("Provider", ""))
        state["provider_name"] = active
        if res.get("summary"):
            state["summary"] = res.get("summary", "No summary generated.")
            state["goals"] = res.get("goals", [])
            state["success_criteria"] = res.get("success_criteria", [])
            state["constraints"] = res.get("constraints", [])
        else:
            print(f"[{state['intake_id']}] JSON extraction yielded empty result — using fallback")
            apply_fallback_analysis(state)
            state["provider_name"] = f"{active}/partial"
    except Exception as e:
        print(f"[{state['intake_id']}] Extraction Error (all providers failed): {e}")
        apply_fallback_analysis(state)
        state["provider_name"] = "Fallback/Offline"
    return state


async def node_ambiguity(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Ambiguity Review")
    if AI_PROVIDER_NAME in ("fallback", "offline"):
        apply_fallback_ambiguity(state)
        return state

    provider = get_provider(state.get("gemini_api_key"))
    str_parser = StrOutputParser()
    prompt = ChatPromptTemplate.from_template("""
Review this project brief. Identify missing info and risks.
SUMMARY: {summary}
GOALS: {goals}

Respond with ONLY a valid JSON object:
{{"ambiguities": [{{"field_missing": "Budget", "reason": "No budget specified", "suggested_question": "What is the budget?"}}],
  "followup_questions": ["Question 1?", "Question 2?", "Question 3?"]}}
""")

    async def _invoke(p):
        llm = p.get_llm()
        chain = prompt | llm | str_parser
        raw = await p.invoke_with_backoff(chain, {
            "summary": state["summary"],
            "goals": json.dumps(state["goals"]),
        })
        return extract_json_from_text(raw)

    try:
        res = await _invoke(provider)
        state["ambiguities"] = res.get("ambiguities", [])
        state["followup_questions"] = res.get("followup_questions", [])
        if not state["ambiguities"]:
            apply_fallback_ambiguity(state)
    except Exception as e:
        print(f"[{state['intake_id']}] Ambiguity Error (all providers failed): {e}")
        apply_fallback_ambiguity(state)
    return state

async def node_tone(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Tone Analysis")
    state["tone_profile"] = "Professional, action-oriented"
    return state

async def node_finalize(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Finalize - Saving to Mesh")
    summary_text = state["summary"]
    if isinstance(summary_text, list):
        summary_text = " ".join(summary_text)
    
    final_payload = {
        "summary": summary_text,
        "goals": state["goals"],
        "success_criteria": state["success_criteria"],
        "ambiguities": state["ambiguities"],
        "followup_questions": state["followup_questions"],
        "tone_profile": state["tone_profile"],
        "confidence_score": 0.95,
        "is_confirmed": False,
        "cot_log": f"Engine: {state.get('provider_name', 'Unknown')}",
    }
    async with httpx.AsyncClient() as client:
        try:
            url = f"{API_URL}/api/v1/intake/{state['intake_id']}/confirm"
            headers = {"Internal-Service-Key": INTERNAL_SERVICE_KEY}
            resp = await client.patch(url, json=final_payload, headers=headers)
            if resp.status_code == 200:
                print(f"[{state['intake_id']}] Successfully saved brief.")
                rc = await get_redis_client()
                try:
                    await rc.publish(f"intake:events:{state['intake_id']}", "COMPLETED")
                except Exception as re:
                    print(f"[{state['intake_id']}] Redis publish error: {re}")
                finally:
                    await rc.aclose()
            else:
                print(f"[{state['intake_id']}] Failed to save brief: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"[{state['intake_id']}] Finalization Error: {e}")
    return state

# --- Graph Definition ---
workflow = StateGraph(IntakeState)
workflow.add_node("ingest", node_ingest)
workflow.add_node("transcribe_and_vision", node_transcribe_and_vision)
workflow.add_node("transcribe", node_transcribe)
workflow.add_node("vision", node_vision)
workflow.add_node("merge", node_merge)
workflow.add_node("analyze", node_analyze)
workflow.add_node("ambiguity", node_ambiguity)
workflow.add_node("tone", node_tone)
workflow.add_node("finalize", node_finalize)

def route_after_ingest(state: IntakeState) -> str:
    has_audio = bool(state.get("audio_url"))
    has_image = bool(state.get("image_url"))
    if has_audio and has_image: return "transcribe_and_vision"
    if has_audio: return "transcribe"
    if has_image: return "vision"
    return "merge"

workflow.set_entry_point("ingest")
workflow.add_conditional_edges("ingest", route_after_ingest, {
    "transcribe_and_vision": "transcribe_and_vision",
    "transcribe": "transcribe",
    "vision": "vision",
    "merge": "merge",
})
workflow.add_edge("transcribe_and_vision", "merge")
workflow.add_edge("transcribe", "merge")
workflow.add_edge("vision", "merge")
workflow.add_edge("merge", "analyze")
workflow.add_edge("analyze", "ambiguity")
workflow.add_edge("ambiguity", "tone")
workflow.add_edge("tone", "finalize")
workflow.add_edge("finalize", END)

app_graph = workflow.compile()

async def run_pipeline(payload: dict):
    state = IntakeState(
        intake_id=payload["intake_id"],
        type=payload["type"],
        raw_text=payload.get("raw_text"),
        audio_url=payload.get("audio_url"),
        image_url=payload.get("image_url"),
        transcription=None,
        ocr_text=None,
        unified_context="",
        summary="",
        goals=[],
        success_criteria=[],
        constraints=[],
        ambiguities=[],
        followup_questions=[],
        confidence_score=0.0,
        tone_profile="",
        retry_count=0,
        gemini_api_key=payload.get("gemini_api_key"),
        provider_name="Unknown",
    )
    await app_graph.ainvoke(state)
