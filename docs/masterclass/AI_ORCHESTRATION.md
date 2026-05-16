# Masterclass: AI Orchestration with LangGraph

Project Briefly doesn't just "call an LLM." It uses a **sophisticated multi-agent pipeline** built on **LangGraph**. This allows us to handle complex, multi-modal inputs (text + audio + images) with high reliability.

## 1. What is LangGraph?
LangGraph is a library for building stateful, multi-actor applications with LLMs. Unlike a simple "Chain," LangGraph treats the AI process as a **State Machine (StateGraph)**.
- **Nodes**: Represent a single step in the process (e.g., "Transcribe Audio").
- **Edges**: Represent the flow between nodes.
- **State**: A shared object that travels through the graph, accumulating data.

## 2. The Brief Generation Pipeline
The graph (`ai_service/agents/orchestrator.py`) consists of several nodes:
1.  **Ingest**: Validates the input payload.
2.  **Transcribe/Vision**: Conditional nodes that only run if audio or images are present. They use Gemini's multi-modal capabilities.
3.  **Merge**: Combines the raw text, transcriptions, and OCR results into a "Unified Context."
4.  **Analyze**: The core reasoning step. It extracts goals, success criteria, and constraints.
5.  **Ambiguity**: A "Reviewer" node that looks for missing information and generates follow-up questions.
6.  **Finalize**: Saves the finished brief back to the Go backend via a secure internal API call.

## 3. Multi-Provider Abstraction
We built a flexible provider layer (`ai_service/providers/`):
- **Gemini Provider**: Our primary production engine. It handles exponential backoff for rate limits and uses Google's latest Flash models.
- **Ollama Provider**: Allows for **completely local inference**. If you set `AI_PROVIDER=ollama`, the entire pipeline runs on your machine using Mistral/Llama without sending data to Google.

## 4. Handling Failures
- **Retry Logic**: Every node can be configured with retries.
- **Provider Fallbacks**: (Being Refined) In a production setting, if Gemini fails, the system can automatically failover to a local Ollama instance.
- **Status Updates**: As the state travels through the graph, the worker publishes updates to Redis, which the Go backend's SSE handler picks up to show progress bars in the UI.
