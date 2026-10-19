CREATE TABLE match_messages (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('SHIPPER', 'CARRIER', 'DRIVER')),
    body VARCHAR(2000) NOT NULL CHECK (LENGTH(TRIM(body)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_messages_match_created ON match_messages(match_id, created_at);
