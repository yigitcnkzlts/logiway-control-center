CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY,
    user_id     UUID         NOT NULL,
    channel     VARCHAR(32)  NOT NULL DEFAULT 'IN_APP',
    type        VARCHAR(100) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    body        VARCHAR(1000) NOT NULL,
    payload_json JSONB       NOT NULL DEFAULT '{}'::jsonb,
    read_at     TIMESTAMPTZ  NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);
