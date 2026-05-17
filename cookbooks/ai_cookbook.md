# Briefly AI Cookbook: Python + LangGraph + Gemini 1.5 Flash

You are developing the heavy NLP/LLM orchestration engine. The worker subscribes to a Redis queue, processes multi-stage intelligence graphs via **LangGraph**, and sends results to the Go REST API.

---

## 1. 🛡️ The Gemini Circuit Breaker Pattern (Resiliency & SRE)
Previously, rate-limited (429) or invalid (401) API keys triggered redundant LLM pipeline attempts, causing massive request spam. We designed an in-memory **Circuit Breaker** to protect the infrastructure.

### The Algorithm
*   **Key Blacklisting**: Any auth or rate-limit exception (`429`, `401`, `RESOURCE_EXHAUSTED`) immediately blacklists that specific API key for **5 minutes** inside a thread-safe context (`ai_service/providers/__init__.py`).
*   **Zero-Attempt Bypass**: The provider factory audits the blacklist on *every stage*. If the key is blacklisted, it completely bypasses Gemini and routes immediately to **Ollama** (`tinyllama`) **without making a single external HTTP call**.

---

## 2. 🐳 Local Ollama Fallback Container
To support local development and keep operating when Gemini limits are exhausted, we run a localized Ollama service.
*   **Docker Endpoint**: `http://ollama:11434` (accessible on the shared Docker bridge network).
*   **Local Model**: The worker falls back to the high-efficiency `tinyllama` model, guaranteeing fast local inference without port conflicts with the host.

---

## 3. The Intake State Schema (`IntakeState`)
The single source of truth flowing through the LangGraph nodes. Keep this in sync with backend GORM schema.

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
    goals: Optional[List[Goal]]        # [{"title", "detail"}]
    success_criteria: Optional[List[str]]
    ambiguities: Optional[List[Ambiguity]]  # [{"field_missing", "reason", "suggested_question"}]
    followup_questions: Optional[List[str]]
    confidence_score: float
    tone_profile: str
    retry_count: int
    gemini_api_key: Optional[str]      # Injected from user profile
```

---

## 4. The LangGraph Directed Acyclic Graph (DAG)

```
ingest ──► route_after_ingest ──► transcribe_and_vision ──► merge
                                ├──► transcribe ──────────► merge
                                ├──► vision ─────────────► merge
                                └──► merge (text-only)
                                              │
                                           analyze ──► ambiguity ──► tone ──► finalize ──► END
```

### Node Mechanics & Fail-Safes
All LLM nodes call Google Generative AI chains wrapped in standard `try/except` blocks. If an API call fails, the node writes a safe default value (`[]` or `""`) to prevent pipeline crashes.

---

## 5. Async Redis Job Worker Loop
The worker loops indefinitely using `redis.asyncio` to fetch payloads atomically:

```python
async def run_worker():
    redis_client = await get_redis_client()
    try:
        while True:
            # Atomic blocking pop (prevents duplicate processing)
            _, payload_raw = await redis_client.brpop("intake:queue")
            payload = json.loads(payload_raw)
            await run_pipeline(payload)
    finally:
        await redis_client.aclose()
```

*   **Completion Notification**: Upon completing the pipeline, `node_finalize` writes a HTTP confirmation to the Go API and publishes `COMPLETED` or `FAILED` to the Redis PubSub channel `intake:events:{id}` to trigger real-time client updates.
