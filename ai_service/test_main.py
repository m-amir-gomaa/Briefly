import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app, process_queue

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai_worker"}

@pytest.mark.asyncio
@patch("main.run_pipeline")
@patch("main.redis_client")
async def test_process_queue_success(mock_redis, mock_run_pipeline):
    """Test that the worker correctly pulls a job from Redis and triggers the pipeline."""
    # Mock Redis BRPOP returning a valid job payload
    mock_redis.brpop = AsyncMock(return_value=(
        b"intake:queue", 
        b'{"intake_id": "123e4567-e89b-12d3-a456-426614174000", "type": "TEXT", "raw_text": "Test project brief"}'
    ))
    
    # Mock run_pipeline to return immediately
    mock_run_pipeline.return_value = None
    
    # Run the queue processor as a background task
    task = asyncio.create_task(process_queue())
    
    # Yield control to allow the task to run its first loop iteration
    await asyncio.sleep(0.1)
    
    # Cancel the infinite loop
    task.cancel()
    
    # Assert run_pipeline was called with the correct parsed JSON payload
    mock_run_pipeline.assert_called_once_with({
        "intake_id": "123e4567-e89b-12d3-a456-426614174000",
        "type": "TEXT",
        "raw_text": "Test project brief"
    })
