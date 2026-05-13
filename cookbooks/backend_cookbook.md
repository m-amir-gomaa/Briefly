# Briefly Backend Cookbook: Go + Gin + GORM

## Role Summary
You are building the \"Brain Stem\" of the platform: a stateless, high-concurrency REST API that bridges the Vite frontend to the CockroachDB database and the Redis task queue.

**Tech Stack**: **Go 1.23**, Gin, GORM, **CockroachDB** (via PostgreSQL wire protocol, `gorm.io/driver/postgres`), Redis (Cluster mode), `gorm.io/datatypes` for JSONB.

---

## 1. Concurrency & Performance
*   **GOGC=200**: Set in production env to trade RAM for lower GC pause times. Do not load file binaries into Go memory.
*   **Streaming**: For audio/image uploads, generate a Pre-Signed URL to MinIO/R2. Never proxy binary data through Go.
*   **Real-Time**: Use **SSE (Server-Sent Events)** via the `GET /api/v1/events/:intake_id` endpoint. The Go handler subscribes to a Redis PubSub channel (`intake:events:<id>`) and forwards events to the client. No WebSockets.
*   **Context Propagation**: Every GORM call MUST receive the request context so cancelled client requests propagate to the DB:
    ```go
    db.DB.WithContext(c.Request.Context()).Create(&intake)
    ```

---

## 2. Database (CockroachDB via GORM)

### Schema (models.go — exact field names)
```go
type User struct {
    ID           uuid.UUID
    Email        string
    GeminiAPIKey string // Used to route jobs to the correct AI profile
}

type Intake struct {
    ID       uuid.UUID    `gorm:"type:uuid;default:gen_random_uuid()"`
    UserID   uuid.UUID
    Type     IntakeType   // TEXT | VOICE | IMAGE | MULTI
    RawText  string
    AudioURL string
    ImageURL string
    Status   IntakeStatus // PENDING | PROCESSING | COMPLETED | FAILED
    Brief    *Brief       `gorm:"foreignKey:IntakeID"`
}

type Brief struct {
    ID                uuid.UUID
    IntakeID          uuid.UUID      `gorm:"uniqueIndex"`
    Summary           string
    Goals             datatypes.JSON `gorm:"type:jsonb"` // []Goal
    SuccessCriteria   datatypes.JSON `gorm:"type:jsonb"` // []string
    Ambiguities       datatypes.JSON `gorm:"type:jsonb"` // []Ambiguity
    FollowupQuestions datatypes.JSON `gorm:"type:jsonb"` // []string
    ConfidenceScore   float32
    ToneProfile       string
    ShareToken        string         `gorm:"uniqueIndex"`
    IsConfirmed       bool
    ConfirmedAt       *time.Time
}

type Goal struct { Title string `json:"title"`; Detail string `json:"detail"` }
type Ambiguity struct { FieldMissing string `json:"field_missing"`; Reason string `json:"reason"`; SuggestedQuestion string `json:"suggested_question"` }
```

**Key rules**:
*   Do NOT create separate `goals` or `ambiguities` tables. They are JSONB columns on `briefs`.
*   When writing JSONB from a Go slice, always `json.Marshal()` it first into `datatypes.JSON` before assigning.
*   The `PATCH /api/v1/intake/:id/confirm` endpoint (called by the AI service) is where the Brief is created.

---

## 3. The Job Queue (Redis)
When an intake is saved by `POST /api/v1/intake`, push a job to the `intake:queue` list:
```go
payload, _ := json.Marshal(map[string]interface{}{
    "intake_id":      intake.ID,
    "type":           intake.Type,
    "audio_url":      intake.AudioURL,
    "image_url":      intake.ImageURL,
    "raw_text":       intake.RawText,
    "gemini_api_key": user.GeminiAPIKey, // Injected into the AI state
    "enqueued_at":    time.Now().Format(time.RFC3339),
})
db.Redis.LPush(db.Ctx, "intake:queue", payload)
```

The Python worker consumes this via `BRPOP intake:queue`. The payload keys must **exactly match** the `IntakeState` TypedDict fields in `ai_service/agents/orchestrator.py`.

---

## 4. Redis Distributed Mode
The Redis client supports Cluster mode. Controlled by the `REDIS_CLUSTER_MODE` env var:
```go
// internal/db/db.go
if os.Getenv("REDIS_CLUSTER_MODE") == "true" {
    // Use redis.NewClusterClient
} else {
    // Use redis.NewClient (single-node for local dev)
}
```

---

## 5. Authentication (JWT)
*   Generate signed JWTs on login. Return as `HttpOnly`, `Secure` cookies. **Never** in response bodies or localStorage.
*   The `middleware/auth.go` validates JWTs on all protected routes.

---

## 6. How to Build a Handler (AI Agent Prompt)
> *"Write a Gin handler for POST /api/v1/intake. Follow the Briefly Backend Cookbook: Parse a multipart form, set `IntakeType` based on `has_audio`/`has_image` flags, save the Intake to GORM with Context propagation, then LPUSH a JSON payload to the Redis `intake:queue` list. The payload keys must match the Python `IntakeState` TypedDict."*

## 7. Review & Ship
Verify the handler:
- Has no race conditions
- Respects context cancellation
- Does NOT load file bytes into Go memory
- Redis payload keys exactly match `IntakeState` in `orchestrator.py`
