# Briefly Backend Cookbook: Go/Gin

## Role Summary
You are building the "Brain Stem" of the platform. You connect the Frontend to the Postgres Database and the Redis Queue. 
**Tech Stack**: Go 1.22, Gin, GORM, Postgres (`pgvector`), Redis.

## 1. Concurrency & Performance
We are operating under a strict limit of 250 RPS on an Oracle ARM VPS.
*   **GOGC**: The environment will run with `GOGC=200` to trade RAM for lower CPU latency. Ensure you don't introduce massive memory leaks (e.g., loading 50MB files into memory).
*   **Streaming**: For large audio files (25MB), you MUST generate a Cloudflare R2 Pre-Signed URL. Do not proxy the binary data through Go.
*   **Streaming**: Utilize high-performance Server-Sent Events (SSE) to provide zero-stutter updates to the Vite frontend. Ensure headers are set correctly to disable proxy buffering.

## 2. Database (GORM, JSONB, pgvector)
The AI outputs are schema-less JSON. We use Postgres `JSONB` to store them.
*   **No Child Tables**: Do not create `goals` or `ambiguities` tables. They live inside the `Brief` model as `datatypes.JSON`.
*   **Context Passing**: Every GORM call must receive the request context. If the client disconnects, the query must cancel.
    ```go
    db.DB.WithContext(c.Request.Context()).Create(&intake)
    ```
*   **pgvector Memory**: Store AI-generated text embeddings using the `pgvector` extension to serve as the long-term RAG memory for project management tasks.

## 3. The Job Queue & Caching (Redis)
When an intake is saved, you push a job to the Python worker via Redis.
*   **Queue**: Use `db.Redis.LPush()` (List push). Do not use Pub/Sub.
*   **Read-Through Cache**: For frequent queries (like public briefs), attempt to read from Redis first. If it misses, query Postgres and save the result to Redis with a TTL.

## 4. Authentication (JWT)
*   **Stateless Auth**: Generate signed JWTs on successful login. Return them as `HttpOnly`, `Secure` cookies. Do not use session storage.

## 4. How to Build Using an AI Agent
When you want an AI to build a handler, paste this exact prompt:
> *"Write a Gin handler for POST /api/v1/intake. Follow the Briefly Backend Cookbook: The handler must parse a JSON body, generate a UUID, save it to GORM with Context propagation, and LPUSH the JSON payload to the 'intake:queue' list in Redis."*

## 5. Review & Ship
Verify the handler has no race conditions and respects Context Cancellation. Ensure the JSON payload pushed to Redis perfectly matches the `IntakeState` typed dict in Python.
