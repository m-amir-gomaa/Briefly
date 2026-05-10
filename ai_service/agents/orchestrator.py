"""
Briefly AI Orchestrator — LangGraph Pipeline
Full implementation with all nodes including audio transcription, vision OCR,
and tone detection via Gemini 1.5 Flash.
"""

import base64
import json
import logging
import os
import secrets
from typing import Any, Dict, List, Optional, TypedDict

import httpx
import redis.asyncio as aioredis
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph

logger = logging.getLogger("briefly.orchestrator")

API_URL = os.getenv("API_URL", "http://localhost:8080")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


# ── State Definition ─────────────────────────────────────────

class Goal(TypedDict):
    title: str
    detail: str


class Ambiguity(TypedDict):
    field_missing: str
    reason: str
    suggested_question: str


class ShipmentState(TypedDict):
    intake_id: str
    type: str
    raw_text: Optional[str]
    audio_url: Optional[str]
    image_url: Optional[str]
    transcription: Optional[str]
    ocr_text: Optional[str]
    unified_context: str
    summary: str
    goals: List[Goal]
    success_criteria: List[str]
    constraints: List[str]
    ambiguities: List[Ambiguity]
    followup_questions: List[str]
    evidence_map: Dict[str, str]
    cot_log: str
    confidence_score: float
    tone_profile: str
    retry_count: int


# ── LLM Setup ────────────────────────────────────────────────

def get_llm():
    """Get Gemini 1.5 Flash LLM instance."""
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.2,
        convert_system_message_to_human=True,
    )


# ── Graph Nodes ──────────────────────────────────────────────

def node_ingest(state: ShipmentState) -> dict:
    """Pass-through node; logs intake ID and initializes state."""
    logger.info(f"📋 Ingesting intake {state['intake_id']} (type={state['type']})")
    return {
        "unified_context": "",
        "summary": "",
        "goals": [],
        "success_criteria": [],
        "constraints": [],
        "ambiguities": [],
        "followup_questions": [],
        "evidence_map": {},
        "cot_log": "",
        "confidence_score": 0.0,
        "tone_profile": "",
        "retry_count": 0,
    }


def node_transcribe(state: ShipmentState) -> dict:
    """
    Transcribe audio using Gemini 1.5 Flash Audio API.
    Converts audio_url content to text transcription.
    """
    audio_url = state.get("audio_url", "")
    logger.info(f"🎙️ Transcribing audio: {audio_url}")

    if not audio_url or not GOOGLE_API_KEY:
        logger.warning("⚠️ No audio URL or API key — returning placeholder transcription")
        return {"transcription": "[Audio transcription placeholder — no audio file or API key provided]"}

    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        # If audio_url is a local path or URL, attempt to process it
        # For URLs, download the audio first
        if audio_url.startswith("http"):
            import httpx as hx
            response = hx.get(audio_url, timeout=30)
            audio_data = response.content
        else:
            # Try reading from local filesystem
            try:
                with open(audio_url, "rb") as f:
                    audio_data = f.read()
            except FileNotFoundError:
                logger.warning(f"⚠️ Audio file not found: {audio_url}")
                return {"transcription": f"[Audio file not found: {audio_url}]"}

        # Upload audio to Gemini
        audio_b64 = base64.b64encode(audio_data).decode("utf-8")

        response = model.generate_content([
            "Transcribe the following audio accurately. Return only the transcription text, nothing else.",
            {"mime_type": "audio/wav", "data": audio_b64}
        ])

        transcription = response.text.strip()
        logger.info(f"✅ Audio transcribed: {len(transcription)} chars")
        return {"transcription": transcription}

    except Exception as e:
        logger.error(f"❌ Audio transcription failed: {e}")
        return {"transcription": f"[Transcription error: {str(e)}]"}


def node_vision(state: ShipmentState) -> dict:
    """
    Extract text from image using Gemini 1.5 Flash Vision API.
    Performs OCR and contextual extraction on image_url content.
    """
    image_url = state.get("image_url", "")
    logger.info(f"👁️ Processing image: {image_url}")

    if not image_url or not GOOGLE_API_KEY:
        logger.warning("⚠️ No image URL or API key — returning placeholder OCR")
        return {"ocr_text": "[Image OCR placeholder — no image file or API key provided]"}

    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Load image data
        if image_url.startswith("http"):
            import httpx as hx
            response = hx.get(image_url, timeout=30)
            image_data = response.content
            mime_type = response.headers.get("content-type", "image/jpeg")
        else:
            try:
                with open(image_url, "rb") as f:
                    image_data = f.read()
                # Detect mime type from extension
                if image_url.lower().endswith(".png"):
                    mime_type = "image/png"
                elif image_url.lower().endswith(".webp"):
                    mime_type = "image/webp"
                else:
                    mime_type = "image/jpeg"
            except FileNotFoundError:
                logger.warning(f"⚠️ Image file not found: {image_url}")
                return {"ocr_text": f"[Image file not found: {image_url}]"}

        image_b64 = base64.b64encode(image_data).decode("utf-8")

        response = model.generate_content([
            "Extract all visible text and relevant information from this image. "
            "Include any handwritten notes, printed text, diagrams, tables, or labels. "
            "Return the extracted content as plain text.",
            {"mime_type": mime_type, "data": image_b64}
        ])

        ocr_text = response.text.strip()
        logger.info(f"✅ Image OCR completed: {len(ocr_text)} chars")
        return {"ocr_text": ocr_text}

    except Exception as e:
        logger.error(f"❌ Image OCR failed: {e}")
        return {"ocr_text": f"[OCR error: {str(e)}]"}


def node_merge(state: ShipmentState) -> dict:
    """Merge raw_text + transcription + ocr_text into unified_context."""
    parts = []

    if state.get("raw_text"):
        parts.append(f"[Text Input]\n{state['raw_text']}")

    if state.get("transcription") and not state["transcription"].startswith("["):
        parts.append(f"[Audio Transcription]\n{state['transcription']}")

    if state.get("ocr_text") and not state["ocr_text"].startswith("["):
        parts.append(f"[Image OCR]\n{state['ocr_text']}")

    unified = "\n\n---\n\n".join(parts) if parts else "No context provided."

    logger.info(f"🔗 Merged context: {len(unified)} chars from {len(parts)} sources")
    return {"unified_context": unified}


def node_analyze(state: ShipmentState) -> dict:
    """
    Extract summary, goals, success_criteria, and constraints via Gemini.
    """
    logger.info("🔬 Analyzing intake context...")

    llm = get_llm()
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages([
        ("human", """You are a professional project consultant. Analyze the following intake context and extract a structured brief.

CONTEXT:
{context}

Return a JSON object with exactly these fields:
- "summary": A concise 2-sentence overview of the project/request.
- "goals": A list of objects, each with "title" (string) and "detail" (string).
- "success_criteria": A list of measurable success criteria strings.
- "constraints": A list of constraint or limitation strings.
- "evidence_map": An object mapping each goal title to the source text that supports it.
- "confidence_score": A float between 0.0 and 1.0 indicating how confident you are in the analysis.
- "cot_log": Your chain-of-thought reasoning process as a string.

Return ONLY valid JSON, no markdown formatting.""")
    ])

    try:
        chain = prompt | llm | parser
        result = chain.invoke({"context": state["unified_context"]})

        logger.info(f"✅ Analysis complete: {len(result.get('goals', []))} goals extracted")

        return {
            "summary": result.get("summary", ""),
            "goals": result.get("goals", []),
            "success_criteria": result.get("success_criteria", []),
            "constraints": result.get("constraints", []),
            "evidence_map": result.get("evidence_map", {}),
            "confidence_score": float(result.get("confidence_score", 0.5)),
            "cot_log": result.get("cot_log", ""),
        }

    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        return {
            "summary": f"Analysis failed: {str(e)}",
            "goals": [],
            "success_criteria": [],
            "constraints": [],
            "evidence_map": {},
            "confidence_score": 0.0,
            "cot_log": f"Error during analysis: {str(e)}",
        }


def node_ambiguity(state: ShipmentState) -> dict:
    """
    Identify ambiguities, missing info, and generate follow-up questions via Gemini.
    """
    logger.info("🔍 Detecting ambiguities...")

    llm = get_llm()
    parser = JsonOutputParser()

    goals_str = json.dumps(state.get("goals", []), indent=2)

    prompt = ChatPromptTemplate.from_messages([
        ("human", """Review this project summary and goals. Identify any missing information, unclear requirements, or potential risks.

SUMMARY:
{summary}

GOALS:
{goals}

Return a JSON object with exactly these fields:
- "ambiguities": A list of objects, each with:
  - "field_missing": What information is missing (string)
  - "reason": Why it matters (string)
  - "suggested_question": A question to ask the client to clarify (string)
- "followup_questions": A list of exactly 3 high-priority follow-up question strings.

Return ONLY valid JSON, no markdown formatting.""")
    ])

    try:
        chain = prompt | llm | parser
        result = chain.invoke({
            "summary": state.get("summary", ""),
            "goals": goals_str,
        })

        logger.info(f"✅ Found {len(result.get('ambiguities', []))} ambiguities")

        return {
            "ambiguities": result.get("ambiguities", []),
            "followup_questions": result.get("followup_questions", []),
        }

    except Exception as e:
        logger.error(f"❌ Ambiguity detection failed: {e}")
        return {
            "ambiguities": [],
            "followup_questions": [
                "Could you provide more details about the project scope?",
                "What is the expected timeline for this project?",
                "Are there any budget constraints we should be aware of?",
            ],
        }


def node_tone(state: ShipmentState) -> dict:
    """
    Detect communication tone from the unified context using Gemini.
    """
    logger.info("🎨 Detecting tone profile...")

    if not GOOGLE_API_KEY:
        return {"tone_profile": "startup_casual"}

    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages([
        ("human", """Analyze the communication tone of the following text and classify it into ONE of these categories:
- startup_casual: Informal, energetic, startup-style communication
- corporate_formal: Professional, structured, enterprise-level communication
- technical_detailed: Heavy on technical specs and requirements
- creative_brief: Design/marketing focused with creative language
- academic_research: Research-oriented with citations and methodology

TEXT:
{context}

Return ONLY the category name, nothing else.""")
    ])

    try:
        chain = prompt | llm
        result = chain.invoke({"context": state.get("unified_context", "")})
        tone = result.content.strip().lower().replace(" ", "_")

        valid_tones = [
            "startup_casual", "corporate_formal", "technical_detailed",
            "creative_brief", "academic_research"
        ]
        if tone not in valid_tones:
            tone = "startup_casual"

        logger.info(f"✅ Tone detected: {tone}")
        return {"tone_profile": tone}

    except Exception as e:
        logger.error(f"❌ Tone detection failed: {e}")
        return {"tone_profile": "startup_casual"}


async def node_finalize(state: ShipmentState, redis_client: aioredis.Redis) -> dict:
    """
    Send results back to Go API via PATCH and publish COMPLETED event.
    """
    intake_id = state["intake_id"]
    logger.info(f"📤 Finalizing intake {intake_id}...")

    # Generate share token
    share_token = base64.urlsafe_b64encode(secrets.token_bytes(24)).decode("utf-8")

    # Build the brief payload
    brief_payload = {
        "summary": state.get("summary", ""),
        "goals": state.get("goals", []),
        "success_criteria": state.get("success_criteria", []),
        "ambiguities": state.get("ambiguities", []),
        "followup_questions": state.get("followup_questions", []),
        "evidence_map": state.get("evidence_map", {}),
        "cot_log": state.get("cot_log", ""),
        "confidence_score": state.get("confidence_score", 0.0),
        "tone_profile": state.get("tone_profile", "startup_casual"),
        "share_token": share_token,
    }

    # PATCH back to Go API
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            url = f"{API_URL}/api/v1/intake/{intake_id}/confirm"
            response = await client.patch(url, json=brief_payload)
            response.raise_for_status()
            logger.info(f"✅ PATCH to {url} succeeded: {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Failed to PATCH results: {e}")

    # Publish COMPLETED event via Redis
    channel = f"intake:events:{intake_id}"
    await redis_client.publish(channel, "COMPLETED")
    logger.info(f"📡 Published COMPLETED to {channel}")

    return {}


# ── Conditional Routing ──────────────────────────────────────

def route_after_ingest(state: ShipmentState) -> list:
    """Determine which processing nodes to run based on intake type."""
    routes = []

    if state.get("audio_url"):
        routes.append("transcribe")
    if state.get("image_url"):
        routes.append("vision")

    if not routes:
        routes.append("merge")

    return routes


# ── Build the Graph ──────────────────────────────────────────

def build_graph():
    """Construct the LangGraph pipeline."""
    graph = StateGraph(ShipmentState)

    # Add nodes
    graph.add_node("ingest", node_ingest)
    graph.add_node("transcribe", node_transcribe)
    graph.add_node("vision", node_vision)
    graph.add_node("merge", node_merge)
    graph.add_node("analyze", node_analyze)
    graph.add_node("ambiguity", node_ambiguity)
    graph.add_node("tone", node_tone)

    # Set entry point
    graph.set_entry_point("ingest")

    # Conditional routing after ingest
    graph.add_conditional_edges(
        "ingest",
        route_after_ingest,
        {
            "transcribe": "transcribe",
            "vision": "vision",
            "merge": "merge",
        },
    )

    # After transcribe/vision → merge
    graph.add_edge("transcribe", "merge")
    graph.add_edge("vision", "merge")

    # Linear pipeline after merge
    graph.add_edge("merge", "analyze")
    graph.add_edge("analyze", "ambiguity")
    graph.add_edge("ambiguity", "tone")
    graph.add_edge("tone", END)

    return graph.compile()


# ── Pipeline Runner ──────────────────────────────────────────

pipeline = build_graph()


async def run_pipeline(payload: dict, redis_client: aioredis.Redis):
    """Execute the full LangGraph pipeline for an intake job."""
    initial_state: ShipmentState = {
        "intake_id": payload["intake_id"],
        "type": payload.get("type", "TEXT"),
        "raw_text": payload.get("raw_text"),
        "audio_url": payload.get("audio_url"),
        "image_url": payload.get("image_url"),
        "transcription": None,
        "ocr_text": None,
        "unified_context": "",
        "summary": "",
        "goals": [],
        "success_criteria": [],
        "constraints": [],
        "ambiguities": [],
        "followup_questions": [],
        "evidence_map": {},
        "cot_log": "",
        "confidence_score": 0.0,
        "tone_profile": "",
        "retry_count": 0,
    }

    logger.info(f"🚀 Starting pipeline for intake {payload['intake_id']}")

    # Run the graph (synchronous nodes)
    final_state = pipeline.invoke(initial_state)

    # Run finalize (async — needs Redis client)
    await node_finalize(final_state, redis_client)

    logger.info(f"🏁 Pipeline complete for intake {payload['intake_id']}")
