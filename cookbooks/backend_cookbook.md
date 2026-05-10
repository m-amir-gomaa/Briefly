# Backend Cookbook

## Overview
The Go backend is a REST API built with Gin, GORM, and Redis. It handles intake submissions, brief storage, SSE streaming, and serves as the central hub between the frontend and AI worker.

## Setup

```bash
cd backend
go mod download
go mod tidy
```

## Environment Variables
```
DATABASE_URL=postgres://briefly:briefly_secret@localhost:5432/briefly_db?sslmode=disable
REDIS_URL=redis://localhost:6379/0
AI_SERVICE_URL=http://localhost:8001
PORT=8080
GOGC=200
```

## Running Locally
```bash
go run ./cmd/api
```

## API Routes

| Method | Path | Handler |
|--------|------|---------|
| POST | `/api/v1/intake` | `SubmitIntake` |
| GET | `/api/v1/intake/:id` | `GetIntakeStatus` |
| PATCH | `/api/v1/intake/:id/confirm` | `UpdateIntakeResults` |
| GET | `/api/v1/public/brief/:token` | `GetPublicBrief` |
| POST | `/api/v1/public/brief/:token/confirm` | `ConfirmBrief` |
| GET | `/api/v1/events/:intake_id` | `SSEHandler` |

## Database
- PostgreSQL 16 with GORM AutoMigrate in dev
- Production schema: `backend/migrations/001_initial_schema.sql`
- Demo user seeded automatically on first run

## Troubleshooting
- **DB connection refused**: Ensure PostgreSQL is running on port 5432
- **Redis connection**: Ensure Redis is running on port 6379
- **CORS issues**: CORS is configured to allow all origins in dev mode
