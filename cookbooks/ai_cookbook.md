# AI Service Cookbook

## Overview
The AI Worker is a Python FastAPI service that consumes intake jobs from Redis and processes them through a LangGraph pipeline using Google Gemini 1.5 Flash.

## Setup

```bash
cd ai_service
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

## Environment Variables
```
REDIS_URL=redis://localhost:6379/0
API_URL=http://localhost:8080
GOOGLE_API_KEY=your_key_here
```

## Running Locally
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Pipeline Nodes

| Node | Purpose | LLM Call |
|------|---------|----------|
| `node_ingest` | Initialize state | No |
| `node_transcribe` | Audio → text via Gemini | Yes |
| `node_vision` | Image → text via Gemini | Yes |
| `node_merge` | Combine all text sources | No |
| `node_analyze` | Extract goals, criteria | Yes |
| `node_ambiguity` | Find gaps & questions | Yes |
| `node_tone` | Detect communication tone | Yes |
| `node_finalize` | PATCH results + publish event | No |

## Troubleshooting
- **No API key**: Pipeline will use fallback/placeholder responses
- **Redis connection**: Ensure Redis is running on the configured URL
- **Pipeline errors**: Check `briefly.orchestrator` logger output
