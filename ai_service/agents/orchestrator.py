from typing import Optional, List, Dict
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, END
import asyncio
import os
import httpx
import json
import redis.asyncio as redis
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

# --- AI Configuration ---
# Using Gemini 1.5 Flash for high speed and free tier support
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.1,
    google_api_key=os.getenv("GOOGLE_API_KEY", "dummy")
)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
API_URL = os.getenv("API_URL", "http://localhost:8080")

# Redis client factory for per-use lifecycle management
async def get_redis_client():
    return await redis.from_url(REDIS_URL)

class Goal(TypedDict):
    title: str
    detail: str

class Ambiguity(TypedDict):
    field_missing: str
    reason: str
    suggested_question: str

class ExtractionBrief(BaseModel):
    summary: str = Field(description="2-sentence overview of the project")
    goals: List[Goal] = Field(description="List of primary project goals")
    success_criteria: List[str] = Field(description="List of measurable success criteria")
    constraints: List[str] = Field(description="List of project constraints")

class AmbiguityAnalysis(BaseModel):
    ambiguities: List[Ambiguity] = Field(description="Missing info or potential issues")
    followup_questions: List[str] = Field(description="3 questions to ask the client")

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
    print(f"[{state['intake_id']}] Node Ingest")
    return state

async def node_transcribe(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Transcribe")
    if not state.get("audio_url") or "dummy" in state["audio_url"]:
        state["transcription"] = ""
        return state
    # TODO: Connect to Gemini 1.5 Flash Audio API
    state["transcription"] = "[Gemini Audio Transcription Stub]"
    return state

async def node_vision(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Vision")
    if not state.get("image_url") or "dummy" in state["image_url"]:
        state["ocr_text"] = ""
        return state
    # TODO: Connect to Gemini 1.5 Flash Vision API
    state["ocr_text"] = "[Gemini Vision OCR Stub]"
    return state

async def node_transcribe_and_vision(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Transcribe+Vision (parallel)")
    # Process both modalities concurrently
    updated_transcribe, updated_vision = await asyncio.gather(
        node_transcribe(state.copy()),
        node_vision(state.copy())
    )
    state["transcription"] = updated_transcribe["transcription"]
    state["ocr_text"] = updated_vision["ocr_text"]
    return state

async def node_merge(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Merge")
    parts = []
    if state.get("raw_text"): parts.append(f"RAW TEXT: {state['raw_text']}")
    if state.get("transcription"): parts.append(f"VOICE TRANSCRIPT: {state['transcription']}")
    if state.get("ocr_text"): parts.append(f"IMAGE CONTENT: {state['ocr_text']}")
    state["unified_context"] = "\n\n".join(parts)
    return state

async def node_analyze(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Analyze")
    parser = PydanticOutputParser(pydantic_object=ExtractionBrief)
    prompt = ChatPromptTemplate.from_template(\"\"\"
    You are a professional business analyst and project manager. 
    Analyze the intake context and extract a structured project brief.
    
    CONTEXT: {context}
    
    {format_instructions}
    \"\"\")
    chain = prompt | llm | parser
    try:
        res = await chain.ainvoke({
            "context": state["unified_context"],
            "format_instructions": parser.get_format_instructions()
        })
        state["summary"] = res.summary
        state["goals"] = [dict(g) for g in res.goals]
        state["success_criteria"] = res.success_criteria
        state["constraints"] = res.constraints
    except Exception as e:
        print(f"[{state['intake_id']}] Extraction Error: {e}")
        state["summary"] = "Error during AI analysis."
        state["goals"] = []
        state["success_criteria"] = []
        state["constraints"] = []
    return state

async def node_ambiguity(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Ambiguity")
    parser = PydanticOutputParser(pydantic_object=AmbiguityAnalysis)
    prompt = ChatPromptTemplate.from_template(\"\"\"
    Review this project summary and goals. Identify missing information or potential issues.
    SUMMARY: {summary}
    GOALS: {goals}
    
    {format_instructions}
    \"\"\")
    chain = prompt | llm | parser
    try:
        res = await chain.ainvoke({
            "summary": state["summary"], 
            "goals": json.dumps(state["goals"]),
            "format_instructions": parser.get_format_instructions()
        })
        state["ambiguities"] = [dict(a) for a in res.ambiguities]
        state["followup_questions"] = res.followup_questions
    except Exception as e:
        print(f"[{state['intake_id']}] Ambiguity Error: {e}")
        state["ambiguities"] = []
        state["followup_questions"] = []
    return state

async def node_tone(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Tone")
    state["tone_profile"] = "startup_casual"
    return state

async def node_finalize(state: IntakeState) -> IntakeState:
    print(f"[{state['intake_id']}] Node Finalize")
    final_payload = {
        "intake_id": state["intake_id"],
        "summary": state["summary"],
        "goals": state["goals"],
        "success_criteria": state["success_criteria"],
        "ambiguities": state["ambiguities"],
        "followup_questions": state["followup_questions"],
        "tone_profile": state["tone_profile"],
        "confidence_score": 0.9,
        "is_confirmed": False,
    }

    async with httpx.AsyncClient() as client:
        try:
            # Update the backend with the generated brief
            url = f"{API_URL}/api/v1/intake/{state['intake_id']}/confirm"
            resp = await client.patch(url, json=final_payload)
            if resp.status_code == 200:
                print(f"[{state['intake_id']}] Successfully updated backend.")
                
                # Publish event to Redis for SSE streaming
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
                print(f"[{state['intake_id']}] Failed to update backend: {resp.status_code}")
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
    if has_audio and has_image:
        return "transcribe_and_vision"
    if has_audio:
        return "transcribe"
    if has_image:
        return "vision"
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
    # Pre-flight check: ensure we aren't duplicating work
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{API_URL}/api/v1/intake/{payload['intake_id']}")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "COMPLETED":
                    return
            elif resp.status_code != 404:
                raise RuntimeError(f"Unexpected status {resp.status_code} while checking intake {payload['intake_id']}")
        except RuntimeError:
            raise
        except Exception as e:
            print(f"[{payload['intake_id']}] Pre-flight check error: {e}")

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