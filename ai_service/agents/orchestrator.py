from typing import TypedDict, Optional, List, Dict
from langgraph.graph import StateGraph, END
import asyncio
import os
import httpx
import json
import redis.asyncio as redis
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# --- AI Configuration ---
# Using Gemini 1.5 Flash for high speed and free tier support
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.1,
    google_api_key=os.getenv("GOOGLE_API_KEY", "dummy")
)

redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
API_URL = os.getenv("API_URL", "http://localhost:8080")

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

# --- Node Functions ---

async def node_ingest(state: ShipmentState) -> ShipmentState:
    print(f"[{state['intake_id']}] Node Ingest")
    return state

async def node_transcribe(state: ShipmentState) -> ShipmentState:
    print(f"[{state['intake_id']}] Node Transcribe")
    if not state.get("audio_url") or "dummy" in state["audio_url"]:
        state["transcription"] = ""
        return state
    # TODO: Connect to Gemini 1.5 Flash Audio API
    state["transcription"] = "[Gemini Audio Transcription Stub]"
    return state

async def node_vision(state: ShipmentState) -> ShipmentState:
    print(f"[{state['intake_id']}] Node Vision")
    if not state.get("image_url") or "dummy" in state["image_url"]:
        state["ocr_text"] = ""
        return state
    # TODO: Connect to Gemini 1.5 Flash Vision API
    state["ocr_text"] = "[Gemini Vision OCR Stub]"
    return state

async def node_merge(state: ShipmentState) -> ShipmentState:
    print(f"[{state['intake_id']}] Node Merge")
    parts = []
    if state.get("raw_text"): parts.append(f"RAW TEXT: {state['raw_text']}")
    if state.get("transcription"): parts.append(f"VOICE TRANSCRIPT: {state['transcription']}")
    if state.get("ocr_text"): parts.append(f"IMAGE CONTENT: {state['ocr_text']}")
    state["unified_context"] = "\n\n".join(parts)
    return state

async def node_analyze(state: ShipmentState) -> ShipmentState:
    print(f"[{state['intake_id']}] Node Analyze")
    prompt = ChatPromptTemplate.from_template("""
    You are a professional logistics consultant. Analyze the intake context and extract a structured brief.
    CONTEXT: {context}
    
    Return JSON with:
    - summary: 2-sentence overview.
    - goals: list of objects with 'title' and 'detail'.
    - success_criteria: list of strings.
    - constraints: list of strings.
    """)
    chain = prompt | llm | JsonOutputParser()
    try:
        res = await chain.ainvoke({"context": state["unified_context"]})
        state["summary"] = res.get("summary", "")
        state["goals"] = res.get("goals", [])
        state["success_criteria"] = res.get("success_criteria", [])
        state["constraints"] = res.get("constraints", [])
    except Exception as e:
        print(f"Extraction Error: {e}")
        state["summary"] = "Error during AI analysis."
    return state

async def node_ambiguity(state: ShipmentState) -> ShipmentState:
    print(f"[{state['intake_id']}] Node Ambiguity")
    prompt = ChatPromptTemplate.from_template("""
    Review this project summary and goals. Identify missing information or risks.
    SUMMARY: {summary}
    GOALS: {goals}
    
    Return JSON with:
    - ambiguities: list of objects with 'field_missing', 'reason', 'suggested_question'.
    - followup_questions: list of 3 strings.
    """)
    chain = prompt | llm | JsonOutputParser()
    try:
        res = await chain.ainvoke({"summary": state["summary"], "goals": json.dumps(state["goals"])})
        state["ambiguities"] = res.get("ambiguities", [])
        state["followup_questions"] = res.get("followup_questions", [])
    except:
        pass
    return state

async def node_tone(state: ShipmentState) -> ShipmentState:
    print(f"[{state['intake_id']}] Node Tone")
    state["tone_profile"] = "startup_casual"
    return state

async def node_finalize(state: ShipmentState) -> ShipmentState:
    print(f"[{state['intake_id']}] Node Finalize")
    
    final_payload = {
        "summary": state["summary"],
        "goals": state["goals"],
        "success_criteria": state["success_criteria"],
        "ambiguities": state["ambiguities"],
        "followup_questions": state["followup_questions"],
        "tone_profile": state["tone_profile"],
        "confidence_score": 0.9,
        "is_confirmed": False
    }

    async with httpx.AsyncClient() as client:
        try:
            url = f"{API_URL}/api/v1/intake/{state['intake_id']}/confirm"
            resp = await client.patch(url, json=final_payload)
            if resp.status_code == 200:
                print(f"[{state['intake_id']}] Successfully updated backend.")
                await redis_client.publish(f"intake:events:{state['intake_id']}", "COMPLETED")
            else:
                print(f"[{state['intake_id']}] Failed to update backend: {resp.status_code}")
        except Exception as e:
            print(f"[{state['intake_id']}] Finalization Error: {e}")
            
    return state

# --- Graph Definition ---

workflow = StateGraph(ShipmentState)

workflow.add_node("ingest", node_ingest)
workflow.add_node("transcribe", node_transcribe)
workflow.add_node("vision", node_vision)
workflow.add_node("merge", node_merge)
workflow.add_node("analyze", node_analyze)
workflow.add_node("ambiguity", node_ambiguity)
workflow.add_node("tone", node_tone)
workflow.add_node("finalize", node_finalize)

def route_after_ingest(state: ShipmentState) -> str:
    if state.get("audio_url"): return "transcribe"
    if state.get("image_url"): return "vision"
    return "merge"

workflow.set_entry_point("ingest")
workflow.add_conditional_edges("ingest", route_after_ingest, {
    "transcribe": "transcribe",
    "vision": "vision",
    "merge": "merge"
})
workflow.add_edge("transcribe", "merge")
workflow.add_edge("vision", "merge")
workflow.add_edge("merge", "analyze")
workflow.add_edge("analyze", "ambiguity")
workflow.add_edge("ambiguity", "tone")
workflow.add_edge("tone", "finalize")
workflow.add_edge("finalize", END)

app_graph = workflow.compile()

async def run_pipeline(payload: dict):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{API_URL}/api/v1/intake/{payload['intake_id']}")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "COMPLETED":
                    return
        except:
            pass

    state = ShipmentState(
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
        evidence_map={},
        cot_log="",
        confidence_score=0.0,
        tone_profile="",
        retry_count=0
    )
    
    await app_graph.ainvoke(state)
