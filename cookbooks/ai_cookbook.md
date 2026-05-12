# Briefly AI Cookbook: Python + LangGraph + Gemini 1.5 Flash

## Role Summary
You are building the heavy computational engine. You receive jobs from the Redis queue, process them through a multi-node LangGraph state machine powered by **Gemini 1.5 Flash**, and write results back to the Go API via HTTP.

**Tech Stack**: Python 3.11, FastAPI (HTTP entrypoint), LangGraph, `langchain-google-genai`, `redis.asyncio`, `httpx`.

> **Pinned version**: This pipeline is locked to the logic in commit `c7c545e09a4e6b43fe9b2dbc69b83bd06eac570b`.

---

## 1. The State Object (`IntakeState`)
The single source of truth flowing through the entire pipeline. **Never add fields without updating the Go backend models.**

```python
class IntakeState(TypedDict):
    intake_id: str
    type: str                          # TEXT | VOICE | IMAGE | MULTI
    raw_text: Optional[str]
    audio_url: Optional[str]
    image_url: Optional[str]
    transcription: Optional[str]       # populated by node_transcribe
    ocr_text: Optional[str]            # populated by node_vision
    unified_context: str               # populated by node_merge
    summary: str                       # populated by node_analyze
    goals: Optional[List[Goal]]        # [{"title": ..., "detail": ...}]
    success_criteria: Optional[List[str]]
    constraints: Optional[List[str]]
    ambiguities: Optional[List[Ambiguity]]  # [{"field_missing", "reason", "suggested_question"}]
    followup_questions: Optional[List[str]]
    confidence_score: float
    tone_profile: str
    retry_count: int
```

**Key rule**: All list fields are `Optional`. Nodes MUST always write safe defaults (`[]`) on failure. Never leave a field in an undefined state.

---

## 2. The LangGraph DAG (exactly as wired)

```
ingest ──► route_after_ingest ──► transcribe_and_vision ──► merge
                                ├──► transcribe ──────────► merge
                                ├──► vision ─────────────► merge
                                └──► merge (text-only)
                                              │
                                           analyze ──► ambiguity ──► tone ──► finalize ──► END
```

### Node Responsibilities
| Node | Description |
|---|---|
| `node_ingest` | No-op pass-through; validates state shape. |
| `node_transcribe` | Stub for Gemini 1.5 Flash Audio API. Sets `state["transcription"]`. |
| `node_vision` | Stub for Gemini 1.5 Flash Vision API. Sets `state["ocr_text"]`. |
| `node_transcribe_and_vision` | Runs both via `asyncio.gather()` — used when both `audio_url` AND `image_url` are present. |
| `node_merge` | Concatenates `raw_text`, `transcription`, `ocr_text` into `unified_context`. |
| `node_analyze` | Calls Gemini to extract `summary`, `goals`, `success_criteria`, `constraints`. |
| `node_ambiguity` | Calls Gemini to extract `ambiguities` and `followup_questions`. |
| `node_tone` | Sets `tone_profile` (currently stubbed as `"startup_casual"`). |
| `node_finalize` | POSTs results to `PATCH /api/v1/intake/{id}/confirm`, then publishes `COMPLETED` to Redis PubSub. |

### The Router (`route_after_ingest`)
```python
def route_after_ingest(state: IntakeState) -> str:
    has_audio = bool(state.get("audio_url"))
    has_image = bool(state.get("image_url"))
    if has_audio and has_image: return "transcribe_and_vision"
    if has_audio:               return "transcribe"
    if has_image:               return "vision"
    return "merge"
```

---

## 3. The Worker Loop & Idempotency
The entry point (`run_pipeline`) is called by the FastAPI worker. Before spending any Gemini tokens, it does a **pre-flight idempotency check**:

```python
async def run_pipeline(payload: dict):
    # 1. Idempotency check — never re-process a completed intake
    resp = await client.get(f"{API_URL}/api/v1/intake/{payload['intake_id']}")
    if resp.status_code == 200 and resp.json().get("status") == "COMPLETED":
        return  # Already done, drop the job silently.

    # 2. Build initial IntakeState from Redis payload
    state = IntakeState(intake_id=..., type=..., raw_text=..., ...)

    # 3. Run the compiled graph
    await app_graph.ainvoke(state)
```

---

## 4. Redis Architecture
*   **Consumption**: Worker uses `BRPOP intake:queue` (blocking pop) to receive jobs. Exactly-once delivery is ensured because BRPOP is atomic.
*   **Event Publishing**: After `node_finalize` writes to the Go API, it publishes `"COMPLETED"` to the channel `intake:events:{intake_id}`. The Go SSE handler is subscribed to this channel and forwards the event to the browser.
*   **Client lifecycle**: Redis clients are created per-use via the `get_redis_client()` factory and explicitly closed with `aclose()`. **Do NOT use a module-level Redis singleton** — it leaks connections.

```python
redis_client = await get_redis_client()
try:
    await redis_client.publish(f"intake:events:{state['intake_id']}", "COMPLETED")
finally:
    await redis_client.aclose()
```

---

## 5. Gemini Integration
```python
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.1,
    google_api_key=os.getenv("GOOGLE_API_KEY", "dummy")
)
chain = prompt | llm | JsonOutputParser()
res = await chain.ainvoke({"context": state["unified_context"]})
```

**Always use `JsonOutputParser`** — not Pydantic parsers. All nodes wrap the `chain.ainvoke` in a `try/except` and write safe defaults on failure. Never let an exception bubble up and crash the worker process.

---

## 6. API Contract (`PATCH /api/v1/intake/:id/confirm`)
This is the payload sent by `node_finalize` to the Go backend:
```json
{
  "summary": "...",
  "goals": [{"title": "...", "detail": "..."}],
  "success_criteria": ["..."],
  "ambiguities": [{"field_missing": "...", "reason": "...", "suggested_question": "..."}],
  "followup_questions": ["..."],
  "tone_profile": "startup_casual",
  "confidence_score": 0.85,
  "is_confirmed": false
}
```

---

## 7. How to Add a New Node (AI Agent Prompt)
> *"Add a new LangGraph node called `node_scoring` to `orchestrator.py`. Follow the Briefly AI Cookbook: It receives `IntakeState`, calls Gemini to score the project brief on a scale of 1-10, and writes the result to `state['confidence_score']`. Wrap the `chain.ainvoke` in try/except and default to `0.0` on error. Wire it between `node_ambiguity` and `node_tone`."*
