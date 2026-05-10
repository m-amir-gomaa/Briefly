# Briefly — Complete Architecture Reference

> **Project:** Briefly (AISprint Hackathon)
> **Repo root:** `aisprint/`
> **Stack summary:** React + TypeScript frontend · Go (Gin) REST API · Python (FastAPI + LangGraph) AI Worker · PostgreSQL · Redis · Nginx · Docker Compose

---

## 1. Bird's-Eye View

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser (User)                         │
│            React 19 / TypeScript / Vite / Tailwind CSS          │
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTP / SSE  (port 80)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Nginx Reverse Proxy                       │
│   /          → Vite dev server (host:5173)                      │
│   /api/      → Go API (briefly_api:8080)                        │
│   /api/v1/events/ → Go API SSE (buffering disabled)            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │                               │
               ▼                               ▼
┌──────────────────────────┐   ┌───────────────────────────────────┐
│     Go Backend API       │   │        Python AI Worker           │
│  Gin · GORM · pgx/v5     │   │  FastAPI · LangGraph · httpx      │
│  Port: 8080              │◄──│  Port: 8001 (health only)         │
└──────────┬───────────────┘   └───────────────────────────────────┘
           │  GORM / pgx                          │ Redis BRPOP / Pub-Sub
           ▼                                      ▼
┌─────────────────────┐              ┌──────────────────────────┐
│   PostgreSQL 16     │              │       Redis 7            │
│   briefly_db        │              │  Queue: intake:queue      │
│   Port: 5432        │              │  PubSub: intake:events:* │
└─────────────────────┘              └──────────────────────────┘
```

---

## 2. Repository Layout

```
aisprint/
├── ai_service/                  # Python AI Worker
│   ├── Dockerfile
│   ├── main.py                  # FastAPI app + Redis queue poller
│   ├── requirements.txt
│   └── agents/
│       └── orchestrator.py      # LangGraph pipeline
│
├── backend/                     # Go REST API
│   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   ├── cmd/
│   │   └── api/
│   │       └── main.go          # Server bootstrap & route registration
│   ├── internal/
│   │   ├── db/
│   │   │   └── db.go            # PostgreSQL + Redis clients
│   │   ├── handlers/
│   │   │   ├── intake.go        # Intake CRUD + Redis enqueue
│   │   │   ├── brief.go         # Public brief read + client sign-off
│   │   │   └── sse.go           # Server-Sent Events stream
│   │   └── models/
│   │       └── models.go        # GORM models: User · Intake · Brief · Feedback
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── frontend/                    # React / TypeScript SPA
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx              # Minimal path-based router
│       ├── components/
│       │   └── Layout.tsx       # AppLayout shell (nav + sidebar)
│       ├── views/
│       │   ├── Dashboard.tsx    # Recent intakes list + stats
│       │   ├── Intake.tsx       # New intake form (text · audio · image)
│       │   └── PublicBrief.tsx  # Client-facing brief + approve button
│       └── store/
│           ├── useAuthStore.ts  # Auth state (stub)
│           └── useIntakeStore.ts # Intake submission + SSE listener
│
├── docs/
│   └── architecture/            # Planning docs + HTML presentations
│
├── infra/
│   └── nginx/
│       └── nginx.conf
│
├── cookbooks/                   # Team runbooks
│   ├── ai_cookbook.md
│   ├── backend_cookbook.md
│   ├── devops_cookbook.md
│   └── frontend_cookbook.md
│
└── docker-compose.yml           # Full local stack definition
```

---

## 3. Infrastructure — Docker Compose

| Service | Image / Build | Port | Role |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 | Primary relational store |
| `redis` | `redis:7-alpine` | 6379 | Job queue (`LPUSH`/`BRPOP`) + Pub-Sub (`PUBLISH`/`SUBSCRIBE`) |
| `api` | `./backend/Dockerfile` | 8080 | Go REST API |
| `ai_worker` | `./ai_service/Dockerfile` | — | Background AI pipeline |
| `nginx` | `nginx:alpine` | 80 | Reverse proxy (single entry-point) |

**Environment variables (API container):**
- `DATABASE_URL` — full PostgreSQL DSN
- `REDIS_URL` — Redis connection string
- `AI_SERVICE_URL` — AI worker health endpoint
- `PORT` — HTTP listen port (default `8080`)
- `GOGC=200` — GC tuning for lower CPU latency

**Environment variables (AI Worker container):**
- `REDIS_URL` — same Redis instance
- `API_URL` — Go backend base URL (for HTTP callbacks)
- `GOOGLE_API_KEY` — Gemini API key

---

## 4. Nginx Configuration

```
location /            → proxy_pass http://host.docker.internal:5173  (Vite HMR / WS upgrade)
location /api/        → proxy_pass http://api:8080/                  (REST, 25MB body, 120s timeout)
location /api/v1/events/ → proxy_pass http://api:8080/...           (SSE: buffering off, no cache)
```

---

## 5. Go Backend

### 5.1 Tech Stack

| Concern | Library |
|---|---|
| HTTP framework | `github.com/gin-gonic/gin v1.12.0` |
| ORM | `gorm.io/gorm v1.31.1` + `gorm.io/driver/postgres` |
| PostgreSQL driver | `github.com/jackc/pgx/v5 v5.6.0` |
| Redis client | `github.com/redis/go-redis/v9 v9.19.0` |
| UUID | `github.com/google/uuid v1.6.0` |
| JSON types (JSONB) | `gorm.io/datatypes v1.2.7` |

### 5.2 Route Table

| Method | Path | Handler | Description |
|---|---|---|---|
| `POST` | `/api/v1/intake` | `SubmitIntake` | Accept multipart form; save Intake; push job to Redis |
| `GET` | `/api/v1/intake/:id` | `GetIntakeStatus` | Return Intake (with nested Brief) |
| `PATCH` | `/api/v1/intake/:id/confirm` | `UpdateIntakeResults` | AI Worker callback: set status=COMPLETED, create Brief |
| `GET` | `/api/v1/public/brief/:token` | `GetPublicBrief` | Client-facing brief lookup by share token |
| `POST` | `/api/v1/public/brief/:token/confirm` | `ConfirmBrief` | Client sign-off (sets `is_confirmed=true`, records `confirmed_at`, `client_name`) |
| `GET` | `/api/v1/events/:intake_id` | `SSEHandler` | SSE stream; subscribes to Redis channel `intake:events:{id}` |

### 5.3 Request / Response — Submit Intake

**Request** `POST /api/v1/intake` (multipart/form-data, max 25 MB)

| Field | Type | Description |
|---|---|---|
| `raw_text` | `string` | Free-form text notes |
| `has_audio` | `"true"` | Signals an audio attachment |
| `has_image` | `"true"` | Signals an image attachment |

**Response** `202 Accepted`
```json
{ "intake_id": "<uuid>", "status": "PENDING" }
```

### 5.4 Intake Processing Flow (Backend)

```
POST /api/v1/intake
  1. Parse multipart form
  2. Load demo user (first user in DB)
  3. Detect IntakeType (TEXT / VOICE / IMAGE)
  4. db.Create(&Intake{...})  →  PostgreSQL
  5. db.Redis.LPush("intake:queue", jobPayload)  →  Redis
  6. Return 202 { intake_id, status }
```

---

## 6. Database Schema

### 6.1 Entity-Relationship

```
users ──< intakes ──1:1── briefs ──< feedback
```

### 6.2 Tables

#### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK, `gen_random_uuid()` |
| `email` | `TEXT` | UNIQUE NOT NULL |
| `agency_name` | `TEXT` | |
| `password_hash` | `TEXT` | NOT NULL (hidden from JSON) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() (auto-trigger) |

#### `intakes`
| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `users(id)` CASCADE |
| `type` | `intake_type` ENUM | `TEXT \| VOICE \| IMAGE \| MULTI` |
| `raw_text` | `TEXT` | |
| `audio_url` | `TEXT` | |
| `image_url` | `TEXT` | |
| `status` | `intake_status` ENUM | `PENDING \| PROCESSING \| COMPLETED \| FAILED` |
| `retry_count` | `INT` | DEFAULT 0 |
| `created_at` | `TIMESTAMPTZ` | |
| `updated_at` | `TIMESTAMPTZ` | |

#### `briefs`
| Column | Type | Description |
|---|---|---|
| `id` | `UUID` | PK |
| `intake_id` | `UUID` | UNIQUE FK → `intakes(id)` |
| `summary` | `TEXT` | 2-sentence AI overview |
| `goals` | `JSONB` | `[{title, detail}]` (GIN indexed) |
| `success_criteria` | `JSONB` | `["string", ...]` |
| `ambiguities` | `JSONB` | `[{field_missing, reason, suggested_question}]` |
| `followup_questions` | `JSONB` | `["string", ...]` |
| `evidence_map` | `JSONB` | `{field: source_text}` |
| `cot_log` | `TEXT` | Chain-of-thought reasoning log |
| `confidence_score` | `REAL` | 0.0 – 1.0 |
| `tone_profile` | `TEXT` | e.g. `startup_casual`, `corporate_formal` |
| `share_token` | `TEXT` | UNIQUE, `base64url(24 random bytes)` |
| `is_confirmed` | `BOOLEAN` | Client sign-off flag |
| `confirmed_at` | `TIMESTAMPTZ` | |
| `client_name` | `TEXT` | |

#### `feedback`
| Column | Type | Description |
|---|---|---|
| `id` | `UUID` | PK |
| `brief_id` | `UUID` | FK → `briefs(id)` |
| `user_id` | `UUID?` | FK → `users(id)` (NULL = client feedback) |
| `comment` | `TEXT` | NOT NULL |
| `created_at` | `TIMESTAMPTZ` | |

---

## 7. Python AI Worker

### 7.1 Tech Stack

| Library | Version | Role |
|---|---|---|
| `fastapi` | 0.110.1 | Health endpoint + startup hook |
| `uvicorn` | 0.29.0 | ASGI server |
| `langgraph` | 0.0.31 | Stateful agent graph |
| `langchain-core` | 0.1.40 | Prompt templates & output parsers |
| `langchain-google-genai` | 1.0.3 | Gemini 1.5 Flash binding |
| `google-generativeai` | 0.5.2 | Underlying Gemini SDK |
| `redis` | 5.0.3 | Async queue consumer + pub-sub publisher |
| `httpx` | (transitive) | Async HTTP calls back to Go API |
| `pydantic` | 2.6.4 | Data validation |

### 7.2 Startup & Queue Loop

```python
# main.py — simplified
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_queue())

async def process_queue():
    while True:
        result = await redis_client.brpop("intake:queue", timeout=0)  # blocks
        payload = json.loads(result[1])
        await run_pipeline(payload)
```

The worker is a **long-running background task** inside the FastAPI process. It blocks on `BRPOP "intake:queue"`, dequeues one job at a time, and invokes the LangGraph pipeline.

### 7.3 LangGraph Pipeline

#### State Shape (`ShipmentState`)

```python
class ShipmentState(TypedDict):
    intake_id: str
    type: str
    raw_text: Optional[str]
    audio_url: Optional[str]
    image_url: Optional[str]
    transcription: Optional[str]    # populated by node_transcribe
    ocr_text: Optional[str]         # populated by node_vision
    unified_context: str            # merged by node_merge
    summary: str
    goals: List[Goal]
    success_criteria: List[str]
    constraints: List[str]
    ambiguities: List[Ambiguity]
    followup_questions: List[str]
    evidence_map: Dict[str, str]
    cot_log: str
    confidence_score: float
    tone_profile: str
    retry_count: int
```

#### Graph Topology

```
                    ┌──────────────────────────────────────────────┐
                    │                   ingest                     │
                    └──────────────┬───────────────────────────────┘
                                   │  route_after_ingest()
              ┌────────────────────┼──────────────────────┐
              │ audio_url?         │ image_url?            │ else
              ▼                    ▼                       │
         transcribe            vision                      │
              │                    │                       │
              └────────────────────┴───────────────────────┘
                                   ▼
                                 merge
                         (unify raw + transcript + OCR)
                                   ▼
                                analyze  ← Gemini 1.5 Flash
                         (summary · goals · success_criteria · constraints)
                                   ▼
                               ambiguity  ← Gemini 1.5 Flash
                         (ambiguities · followup_questions)
                                   ▼
                                  tone
                         (sets tone_profile stub)
                                   ▼
                                finalize
                         (PATCH /api/v1/intake/:id/confirm)
                         (PUBLISH intake:events:{id} "COMPLETED")
                                   ▼
                                  END
```

#### Node Descriptions

| Node | Purpose | LLM Call |
|---|---|---|
| `node_ingest` | Pass-through; logs intake ID | No |
| `node_transcribe` | Stub for Gemini Audio transcription of `audio_url` | Stub |
| `node_vision` | Stub for Gemini Vision OCR of `image_url` | Stub |
| `node_merge` | Concatenates raw_text + transcription + ocr_text into `unified_context` | No |
| `node_analyze` | Extracts `summary`, `goals`, `success_criteria`, `constraints` via JSON prompt | **Yes** |
| `node_ambiguity` | Identifies missing fields, generates `ambiguities` + `followup_questions` | **Yes** |
| `node_tone` | Sets `tone_profile` (currently hard-coded to `startup_casual`) | No |
| `node_finalize` | HTTP `PATCH` back to Go API; Redis `PUBLISH` "COMPLETED" event | No |

---

## 8. Frontend

### 8.1 Tech Stack

| Library | Version | Role |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | ~6.0 | Type safety |
| Vite | 8 | Dev server + bundler |
| Tailwind CSS | 4 | Utility-first styling |
| Zustand | 5 | Lightweight global state |
| Lucide React | 1.14 | Icon set |
| Framer Motion | 12 | Animation library |
| Axios | 1.16 | HTTP client (available but fetch is used in store) |

### 8.2 Routing

The app uses a **manual path-based router** in `App.tsx` (no React Router):

| Path | Component |
|---|---|
| `/` | `DashboardView` |
| `/intake/new` | `IntakeView` |
| `/public/*` | `PublicBriefView` |

### 8.3 Views

| View | File | Description |
|---|---|---|
| `DashboardView` | `views/Dashboard.tsx` | Lists recent intakes with status badges (static mock data) |
| `IntakeView` | `views/Intake.tsx` | Form with text area, image drop-zone, mic recorder; calls `useIntakeStore.submitIntake()` |
| `PublicBriefView` | `views/PublicBrief.tsx` | Client-facing document with goals, ambiguity highlights, "Approve & Sign Off" button |

### 8.4 State Management — `useIntakeStore`

```typescript
// Zustand store (simplified)
interface IntakeState {
  rawText: string;
  hasAudio: boolean;
  hasImage: boolean;
  status: 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  currentIntakeId: string | null;

  submitIntake(): Promise<void>;     // POST /api/v1/intake → multipart
  subscribeToEvents(id): void;       // EventSource /api/v1/events/:id
  reset(): void;
}
```

**Submit flow:**
1. Build `FormData` with `raw_text`, `type`, optional blobs
2. `POST /api/v1/intake` → receive `{ intake_id, status }`
3. Set status to `PROCESSING`
4. Open `EventSource` on `/api/v1/events/{intake_id}`
5. On message `"COMPLETED"` → set status to `COMPLETED`, close `EventSource`

---

## 9. Real-Time Event Flow (End-to-End)

```
Browser                   Nginx           Go API          Redis           AI Worker
  │                         │               │               │               │
  │ POST /api/v1/intake      │               │               │               │
  │─────────────────────────►───────────────►               │               │
  │                         │               │ LPUSH          │               │
  │                         │               │"intake:queue"──►               │
  │   202 { intake_id }     │               │               │               │
  │◄────────────────────────◄───────────────┤               │               │
  │                         │               │               │ BRPOP          │
  │ GET /api/v1/events/:id  │               │               │◄──────────────┤
  │─────────────────────────►───────────────►               │               │
  │                         │               │ SUBSCRIBE      │               │
  │                         │               │"intake:events:{id}"            │
  │                         │               │◄──────────────┤               │
  │    (SSE connection open, server streaming)              │               │
  │                         │               │               │               │
  │                         │               │               │  [run_pipeline]│
  │                         │               │               │               │
  │                         │   PATCH /api/v1/intake/:id/confirm            │
  │                         │               │◄──────────────────────────────┤
  │                         │               │ UPDATE intakes SET status=COMPLETED
  │                         │               │ INSERT briefs(...)             │
  │                         │               │               │               │
  │                         │               │               │  PUBLISH       │
  │                         │               │               │◄──────────────┤
  │                         │               │"COMPLETED"    │               │
  │◄─────────────────────────────────────── SSE event "COMPLETED"
  │  status = COMPLETED     │               │               │               │
  │  EventSource.close()    │               │               │               │
```

---

## 10. Key Design Decisions

| Decision | Detail |
|---|---|
| **Redis as job queue** | Uses `LPUSH` (producer) / `BRPOP` (consumer) pattern — simple, reliable, no extra broker needed |
| **Redis Pub-Sub for SSE** | Go API subscribes to `intake:events:{id}`; AI Worker publishes "COMPLETED". Avoids polling loops |
| **AI worker is a sidecar** | No direct HTTP between frontend and AI; all communication is async via Redis + callback PATCH |
| **Share token** | Briefs get a random `base64url(24 bytes)` token on creation — enables public, auth-free client links |
| **LangGraph for pipeline** | Each processing step is an explicit graph node; enables conditional branching (text/audio/image routing) |
| **Gemini 1.5 Flash** | Chosen for free tier access and speed during hackathon; structured JSON output via `JsonOutputParser` |
| **GORM AutoMigrate + SQL migrations** | Dev uses AutoMigrate; production SQL file (`001_initial_schema.sql`) is applied at container init |
| **No authentication (hackathon stub)** | A demo user is seeded on startup; all intakes are assigned to it |

---

## 11. AI Service — LLM Prompts

### Analyze Node Prompt
```
You are a professional logistics consultant. Analyze the intake context and extract a structured brief.
CONTEXT: {context}

Return JSON with:
- summary: 2-sentence overview.
- goals: list of objects with 'title' and 'detail'.
- success_criteria: list of strings.
- constraints: list of strings.
```

### Ambiguity Node Prompt
```
Review this project summary and goals. Identify missing information or risks.
SUMMARY: {summary}
GOALS: {goals}

Return JSON with:
- ambiguities: list of objects with 'field_missing', 'reason', 'suggested_question'.
- followup_questions: list of 3 strings.
```

---

## 12. Deployment Ports Summary

| Port | Service | Exposed To |
|---|---|---|
| 80 | Nginx | External (browser) |
| 5173 | Vite dev server | Nginx (host → container) |
| 8080 | Go API | Nginx + AI Worker |
| 5432 | PostgreSQL | Go API only |
| 6379 | Redis | Go API + AI Worker |

---

## 13. Future Work / TODOs (noted in code)

- [ ] **Gemini Audio transcription** — `node_transcribe` is a stub; needs real Gemini 1.5 Flash Audio API call
- [ ] **Gemini Vision OCR** — `node_vision` is a stub; needs real Gemini 1.5 Flash Vision API call
- [ ] **File upload to Cloudflare R2** — `SubmitIntake` has commented-out R2 upload logic
- [ ] **Authentication** — `useAuthStore` and `password_hash` field exist but auth is not enforced
- [ ] **React Router** — manual path routing in `App.tsx` should be replaced with a proper router
- [ ] **Client confirmation** — `PublicBriefView` "Approve & Sign Off" button is UI-only, not wired to `POST /public/brief/:token/confirm`
- [ ] **Dashboard data** — `DashboardView` shows static mock data; needs live API calls
- [ ] **Tone detection** — `node_tone` is hard-coded to `startup_casual`; should detect from context
