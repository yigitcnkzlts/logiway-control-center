CREATE TABLE matches (
    id          UUID PRIMARY KEY,
    load_id     UUID        NOT NULL UNIQUE,
    offer_id    UUID        NOT NULL UNIQUE,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    matched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_status ON matches (status);
