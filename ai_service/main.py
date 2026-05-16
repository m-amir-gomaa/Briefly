import os
import json
import asyncio
from fastapi import FastAPI
import redis.asyncio as redis
from dotenv import load_dotenv
from prometheus_client import start_http_server, Counter
from agents.orchestrator import run_pipeline

load_dotenv()

# Metrics
JOBS_PROCESSED = Counter('ai_jobs_processed_total', 'Total AI jobs processed', ['status'])

app = FastAPI(title="Briefly AI Worker")
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

async def process_queue():
    """Background task to pull jobs from Redis queue."""
    print("Started Redis worker polling 'intake:queue'...")
    start_http_server(9091)
    while True:
        try:
            # BRPOP blocks until an item is available
            result = await redis_client.brpop("intake:queue", timeout=0)
            if result:
                _, payload_bytes = result
                payload = json.loads(payload_bytes)
                print(f"Received job for intake: {payload.get('intake_id')}")
                
                # Run the LangGraph pipeline concurrently so it doesn't block the queue
                asyncio.create_task(handle_job(payload))
                
        except Exception as e:
            print(f"Error in Redis polling loop: {e}")
            await asyncio.sleep(1)

async def handle_job(payload: dict):
    """Wrapper to run pipeline and track metrics."""
    try:
        await run_pipeline(payload)
        JOBS_PROCESSED.labels(status='success').inc()
    except Exception as e:
        print(f"Job failed: {e}")
        JOBS_PROCESSED.labels(status='error').inc()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_queue())

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai_worker"}
