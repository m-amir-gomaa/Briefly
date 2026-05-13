import os
import json
import asyncio
import tempfile
import time
from typing import Optional, List, TypedDict, Any

import google.generativeai as genai
import boto3
import httpx
import redis.asyncio as redis
from botocore.client import Config
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph, END

# --- AI Configuration ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
genai.configure(api_key=GOOGLE_API_KEY)

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.1,
    google_api_key=GOOGLE_API_KEY
)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
API_URL = os.getenv("API_URL", "http://localhost:8080")

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

# --- Node Functions ---

async def node_ingest(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Ingest - Starting pipeline")
    return state

async def process_media_with_gemini(file_path: str, mime_type: str, prompt: str) -> str:
    """Helper to upload to Gemini and get result."""
    try:
        # Upload to Gemini Files API
        file_handle = genai.upload_file(path=file_path, mime_type=mime_type)
        print(f"Uploaded file to Gemini: {file_handle.name}")

        # Wait for processing
        while file_handle.state.name == "PROCESSING":
            print(".", end="", flush=True)
            time.sleep(2)
            file_handle = genai.get_file(file_handle.name)

        if file_handle.state.name == "FAILED":
            raise ValueError(f"Gemini file processing failed: {file_handle.name}")

        # Generate content
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        response = model.generate_content([file_handle, prompt])
        
        # Cleanup
        genai.delete_file(file_handle.name)
        
        return response.text
    except Exception as e:
        print(f"Gemini Media Error: {e}")
        return f"[Media Processing Error: {str(e)}]"

async def node_transcribe(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Transcribe (Gemini 1.5 Flash)")
    if not state.get("audio_url"):
        state["transcription"] = ""
        return state

    try:
        # Download from S3 (MinIO)
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            bucket = "briefly-intake"
            key = state["audio_url"].split("/")[-1]
            s3_client.download_file(bucket, key, tmp.name)
            
            # Determine mime type
            mime_type = "audio/mpeg"
            if key.endswith(".wav"): mime_type = "audio/wav"
            elif key.endswith(".mp4"): mime_type = "video/mp4"

            prompt = "Please provide a verbatim transcription of this audio. If it is a video, transcribe the spoken parts."
            state["transcription"] = await process_media_with_gemini(tmp.name, mime_type, prompt)
            os.unlink(tmp.name)
    except Exception as e:
        print(f"[{state['intake_id']}] Transcription Error: {e}")
        state["transcription"] = f"[Error: {str(e)}]"
    
    return state

async def node_vision(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Vision (Gemini 1.5 Flash)")
    if not state.get("image_url"):
        state["ocr_text"] = ""
        return state

    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            bucket = "briefly-intake"
            key = state["image_url"].split("/")[-1]
            s3_client.download_file(bucket, key, tmp.name)
            
            mime_type = "image/jpeg"
            if key.endswith(".png"): mime_type = "image/png"

            prompt = "Describe everything in this image in detail, extracting any text you see."
            state["ocr_text"] = await process_media_with_gemini(tmp.name, mime_type, prompt)
            os.unlink(tmp.name)
    except Exception as e:
        print(f"[{state['intake_id']}] Vision Error: {e}")
        state["ocr_text"] = f"[Error: {str(e)}]"
    
    return state

async def node_transcribe_and_vision(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Transcribe+Vision (parallel)")
    # We run them sequentially for simplicity in the hackathon to avoid rate limits
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
    prompt = ChatPromptTemplate.from_template("""
    You are Briefly AI, a professional project consultant. 
    Analyze the context provided and extract a structured project brief.
    
    CONTEXT: {context}

    Return JSON with:
    - summary: 2-sentence executive summary.
    - goals: list of objects with 'title' (short) and 'detail' (1 sentence).
    - success_criteria: list of 3 specific KPIs.
    - constraints: list of 3 budget/time/technical constraints.
    """)
    chain = prompt | llm | JsonOutputParser()
    try:
        res = await chain.ainvoke({"context": state["unified_context"]})
        state["summary"] = res.get("summary", "No summary generated.")
        state["goals"] = res.get("goals", [])
        state["success_criteria"] = res.get("success_criteria", [])
        state["constraints"] = res.get("constraints", [])
    except Exception as e:
        print(f"[{state['intake_id']}] Extraction Error: {e}")
        state["summary"] = "AI was unable to generate a summary."
    return state

async def node_ambiguity(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Ambiguity Review")
    prompt = ChatPromptTemplate.from_template("""
    Review the project summary and goals. Identify missing information or potential risks.
    SUMMARY: {summary}
    GOALS: {goals}

    Return JSON with:
    - ambiguities: list of objects with 'field_missing', 'reason', 'suggested_question'.
    - followup_questions: list of 3 strings for the user.
    """)
    chain = prompt | llm | JsonOutputParser()
    try:
        res = await chain.ainvoke({
            "summary": state["summary"],
            "goals": json.dumps(state["goals"])
        })
        state["ambiguities"] = res.get("ambiguities", [])
        state["followup_questions"] = res.get("followup_questions", [])
    except Exception as e:
        print(f"[{state['intake_id']}] Ambiguity Error: {e}")
    return state

async def node_tone(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Tone Analysis")
    state["tone_profile"] = "Professional, action-oriented"
    return state

async def node_finalize(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Finalize - Saving to Mesh")
    final_payload = {
        "summary": state["summary"],
        "goals": state["goals"],
        "success_criteria": state["success_criteria"],
        "ambiguities": state["ambiguities"],
        "followup_questions": state["followup_questions"],
        "tone_profile": state["tone_profile"],
        "confidence_score": 0.95,
        "is_confirmed": False,
    }

    async with httpx.AsyncClient() as client:
        try:
            url = f"{API_URL}/api/v1/intake/{state['intake_id']}/confirm"
            resp = await client.patch(url, json=final_payload)
            if resp.status_code == 200:
                print(f"[{state['intake_id']}] Successfully updated Alpha Node.")
                redis_client = await get_redis_client()
                try:
                    await redis_client.publish(
                        f"intake:events:{state['intake_id']}", "COMPLETED"
                    )
                except Exception as re:
                    print(f"[{state['intake_id']}] Redis publish error: {re}")
                finally:
                    await redis_client.aclose()
            else:
                print(f"[{state['intake_id']}] Failed to update Alpha Node: {resp.status_code}")
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
    )
    await app_graph.ainvoke(state)