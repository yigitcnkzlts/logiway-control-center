CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY,
    actor_user_id   UUID,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       VARCHAR(100),
    metadata_json   JSONB        NOT NULL DEFAULT '{}'::jsonb,
    ip_address      VARCHAR(64),
    user_agent      VARCHAR(512),
    correlation_id  VARCHAR(64),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
