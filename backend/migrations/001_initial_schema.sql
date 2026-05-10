-- ─────────────────────────────────────────────────────────
-- 001_initial_schema.sql
-- Initial schema for Project Briefly
-- Run via: docker-compose up (auto-applied from /migrations)
-- ─────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ──────────────────────────────────────────────────
CREATE TYPE intake_type   AS ENUM ('TEXT', 'VOICE', 'IMAGE', 'MULTI');
CREATE TYPE intake_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        TEXT NOT NULL UNIQUE,
    agency_name  TEXT,
    password_hash TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INTAKES ────────────────────────────────────────────────
CREATE TABLE intakes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         intake_type NOT NULL DEFAULT 'TEXT',
    raw_text     TEXT,
    audio_url    TEXT,
    image_url    TEXT,
    status       intake_status NOT NULL DEFAULT 'PENDING',
    retry_count  INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intakes_user_id ON intakes(user_id);
CREATE INDEX idx_intakes_status  ON intakes(status);

-- ── BRIEFS ─────────────────────────────────────────────────
CREATE TABLE briefs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id           UUID NOT NULL UNIQUE REFERENCES intakes(id) ON DELETE CASCADE,
    summary             TEXT,
    goals               JSONB NOT NULL DEFAULT '[]',
    success_criteria    JSONB NOT NULL DEFAULT '[]',
    ambiguities         JSONB NOT NULL DEFAULT '[]',
    followup_questions  JSONB NOT NULL DEFAULT '[]',
    evidence_map        JSONB NOT NULL DEFAULT '{}',
    cot_log             TEXT,           -- Chain-of-Thought reasoning log
    confidence_score    REAL,           -- 0.0 – 1.0
    tone_profile        TEXT,           -- 'corporate_formal', 'startup_casual', 'egyptian_colloquial'
    share_token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
    is_confirmed        BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at        TIMESTAMPTZ,
    client_name         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_briefs_share_token ON briefs(share_token);
CREATE INDEX idx_briefs_intake_id   ON briefs(intake_id);
CREATE INDEX idx_briefs_goals_gin   ON briefs USING GIN (goals);

-- ── FEEDBACK ───────────────────────────────────────────────
CREATE TABLE feedback (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id   UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if from client
    comment    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AUTO-UPDATE updated_at TRIGGER ─────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_intakes_updated_at
    BEFORE UPDATE ON intakes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_briefs_updated_at
    BEFORE UPDATE ON briefs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
