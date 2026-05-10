import os
import json
import asyncio
from fastapi import FastAPI
import redis.asyncio as redis
from dotenv import load_dotenv
from agents.orchestrator import run_pipeline

load_dotenv()

app = FastAPI(title="Briefly AI Worker")
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

async def process_queue():
    """Background task to pull jobs from Redis queue."""
    print("Started Redis worker polling 'intake:queue'...")
    while True:
        try:
            # BRPOP blocks until an item is available
            result = await redis_client.brpop("intake:queue", timeout=0)
            if result:
                _, payload_bytes = result
                payload = json.loads(payload_bytes)
                print(f"Received job for intake: {payload.get('intake_id')}")
                
                # Run the LangGraph pipeline
                await run_pipeline(payload)
                
        except Exception as e:
            print(f"Error processing job: {e}")
            await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_queue())

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai_worker"}
