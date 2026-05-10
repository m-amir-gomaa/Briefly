-- ============================================================
-- Briefly — Initial Database Schema
-- ============================================================

-- ── Custom ENUM types ───────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE intake_type AS ENUM ('TEXT', 'VOICE', 'IMAGE', 'MULTI');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE intake_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        UNIQUE NOT NULL,
    agency_name   TEXT,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Intakes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intakes (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        intake_type   NOT NULL DEFAULT 'TEXT',
    raw_text    TEXT,
    audio_url   TEXT,
    image_url   TEXT,
    status      intake_status NOT NULL DEFAULT 'PENDING',
    retry_count INT           NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intakes_user_id ON intakes(user_id);
CREATE INDEX IF NOT EXISTS idx_intakes_status  ON intakes(status);

-- ── Briefs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS briefs (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id          UUID        UNIQUE NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
    summary            TEXT,
    goals              JSONB       DEFAULT '[]'::jsonb,
    success_criteria   JSONB       DEFAULT '[]'::jsonb,
    ambiguities        JSONB       DEFAULT '[]'::jsonb,
    followup_questions JSONB       DEFAULT '[]'::jsonb,
    evidence_map       JSONB       DEFAULT '{}'::jsonb,
    cot_log            TEXT,
    confidence_score   REAL        DEFAULT 0.0,
    tone_profile       TEXT        DEFAULT 'startup_casual',
    share_token        TEXT        UNIQUE,
    is_confirmed       BOOLEAN     NOT NULL DEFAULT FALSE,
    confirmed_at       TIMESTAMPTZ,
    client_name        TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefs_intake_id   ON briefs(intake_id);
CREATE INDEX IF NOT EXISTS idx_briefs_share_token  ON briefs(share_token);
CREATE INDEX IF NOT EXISTS idx_briefs_goals        ON briefs USING GIN (goals);
CREATE INDEX IF NOT EXISTS idx_briefs_ambiguities  ON briefs USING GIN (ambiguities);

-- ── Feedback ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id   UUID        NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
    comment    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_brief_id ON feedback(brief_id);

-- ── Auto-update trigger for updated_at ──────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_users
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_intakes
        BEFORE UPDATE ON intakes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_briefs
        BEFORE UPDATE ON briefs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Seed demo user ──────────────────────────────────────────
INSERT INTO users (email, agency_name, password_hash)
VALUES ('demo@briefly.ai', 'Demo Agency', '$2a$10$dummyhashfordemopurposes')
ON CONFLICT (email) DO NOTHING;
