"""
Briefly AI Worker — FastAPI + Redis Queue Consumer
Polls Redis intake:queue via BRPOP and dispatches to LangGraph pipeline.
"""

import asyncio
import json
import logging
import os

import redis.asyncio as aioredis
from fastapi import FastAPI

from agents.orchestrator import run_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("briefly.ai_worker")

app = FastAPI(title="Briefly AI Worker", version="1.0.0")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client: aioredis.Redis = None  # type: ignore


@app.on_event("startup")
async def startup_event():
    """Connect to Redis and start the queue processing loop."""
    global redis_client
    redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    logger.info("✅ Redis connected")
    asyncio.create_task(process_queue())
    logger.info("🚀 Queue processor started")


@app.on_event("shutdown")
async def shutdown_event():
    """Close Redis connection."""
    if redis_client:
        await redis_client.close()
    logger.info("👋 AI Worker shutting down")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "briefly-ai-worker"}


async def process_queue():
    """
    Long-running background task that blocks on BRPOP to dequeue
    intake jobs one at a time, then invokes the LangGraph pipeline.
    """
    logger.info("👂 Listening on intake:queue...")

    while True:
        try:
            result = await redis_client.brpop("intake:queue", timeout=0)
            if result is None:
                continue

            _, raw_payload = result
            payload = json.loads(raw_payload)
            intake_id = payload.get("intake_id", "unknown")

            logger.info(f"📥 Dequeued job for intake {intake_id}")

            # Publish PROCESSING status
            channel = f"intake:events:{intake_id}"
            await redis_client.publish(channel, "PROCESSING")

            # Run the LangGraph pipeline
            await run_pipeline(payload, redis_client)

            logger.info(f"✅ Pipeline completed for intake {intake_id}")

        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in queue: {e}")
        except Exception as e:
            logger.error(f"❌ Pipeline error: {e}", exc_info=True)
            # On error, try to publish FAILED status
            try:
                if "intake_id" in payload:
                    channel = f"intake:events:{payload['intake_id']}"
                    await redis_client.publish(channel, "FAILED")
            except Exception:
                pass
