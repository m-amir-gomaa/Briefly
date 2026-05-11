# Briefly AI Cookbook: Python/LangGraph

## Role Summary
You are building the heavy computational engine. You receive jobs from Redis, run them through an LLM state machine, and push results back to Redis.
**Tech Stack**: Python 3.11, FastAPI (for worker process), LangGraph, Google Gemini 1.5 Flash.

## 1. The Queue & Idempotency
You run a persistent `while True` loop calling `redis_client.brpop("intake:queue", timeout=0)`.
*   **Idempotency Check**: Before spending tokens on Gemini, check Redis for a 'processing' lock on the `intake_id`. If it's already marked as completed in the global state, drop the job. 

## 2. The LangGraph State Machine
We use a **Fan-Out/Fan-In** architecture.
*   `node_transcribe` (Audio) and `node_vision` (Image OCR) must run in parallel using `asyncio.gather()`. 
*   **State Isolation**: The `IntakeState` TypedDict must be instantiated locally inside the queue loop. NEVER use global variables.
*   **Semantic Caching**: [Future] Before sending large extraction prompts to Gemini, embed the prompt and query `pgvector`. 
*   **Long-Term Memory (RAG)**: [Future] Use the `Embedding` field in the Postgres Briefs table for historical context.

## 3. Resilience & Security
*   **Circuit Breaker**: If Gemini returns 3 consecutive `429` errors, you must automatically route the LLM call to the local Ollama instance (`http://localhost:11434`).
*   **Prompt Sandboxing**: All outputs must be wrapped in `PydanticOutputParser`. If a user attempts a prompt injection ("Ignore previous instructions"), the parser will fail, and you must catch the `ValidationError` and flag the intake as `FAILED`.

## 4. How to Build Using an AI Agent
When you want an AI to write a LangGraph node, paste this exact prompt:
> *"Write the `node_analyze` function for our LangGraph state machine. Follow the Briefly AI Cookbook: Use Langchain's Google Gemini integration. The prompt must extract goals from the `state['unified_context']`. Output MUST be parsed using a PydanticOutputParser to prevent prompt injection. Return the updated state."*

## 5. Review & Ship
Test the node logic in isolation using a local Jupyter notebook. Ensure the node takes less than 3 seconds to execute. If it passes, add it to `orchestrator.py`.
