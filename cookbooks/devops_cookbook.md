# DevOps Cookbook

## Overview
The entire Briefly stack is orchestrated via Docker Compose with 5 services.

## Quick Start
```bash
# Start everything
docker-compose up --build

# Start in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Reset database
docker-compose down -v
docker-compose up --build
```

## Services

| Service | Port | Health Check |
|---------|------|-------------|
| PostgreSQL | 5432 | `pg_isready` |
| Redis | 6379 | `redis-cli ping` |
| Go API | 8080 | `GET /health` |
| AI Worker | 8001 | `GET /health` |
| Nginx | 80 | N/A |

## Environment
All environment variables are defined in `.env` at the project root.

**Critical**: Set `GOOGLE_API_KEY` in `.env` before running the AI worker.

## Running Without Docker

If Docker is not installed, you can run each service individually:

1. **PostgreSQL**: Install and run locally, create `briefly_db` database, run `001_initial_schema.sql`
2. **Redis**: Install and run locally on port 6379
3. **Go API**: `cd backend && go run ./cmd/api`
4. **AI Worker**: `cd ai_service && pip install -r requirements.txt && uvicorn main:app --port 8001`
5. **Frontend**: `cd frontend && npm install && npm run dev`

## Nginx Configuration
Located at `infra/nginx/nginx.conf`. Routes:
- `/` → Vite dev server (port 5173)
- `/api/` → Go API (port 8080)
- `/api/v1/events/` → SSE with buffering disabled
