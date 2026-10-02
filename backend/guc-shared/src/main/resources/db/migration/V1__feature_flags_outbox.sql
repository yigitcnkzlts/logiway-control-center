CREATE TABLE IF NOT EXISTS feature_flags (
    flag_key      VARCHAR(100) PRIMARY KEY,
    enabled       BOOLEAN      NOT NULL DEFAULT FALSE,
    rules_json    JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id            UUID         PRIMARY KEY,
    event_type    VARCHAR(150) NOT NULL,
    payload_json  JSONB        NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    processed_at  TIMESTAMPTZ  NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_unprocessed ON outbox_events (created_at) WHERE processed_at IS NULL;

INSERT INTO feature_flags (flag_key, enabled)
VALUES ('mfa.required', FALSE)
ON CONFLICT (flag_key) DO NOTHING;
