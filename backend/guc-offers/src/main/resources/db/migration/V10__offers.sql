CREATE TABLE offers (
    id                  UUID PRIMARY KEY,
    load_id             UUID           NOT NULL,
    offerer_type        VARCHAR(20)    NOT NULL,
    offerer_id          UUID           NOT NULL,
    created_by_user_id  UUID           NOT NULL,
    amount              NUMERIC(14, 2) NOT NULL,
    currency            CHAR(3)        NOT NULL,
    message             VARCHAR(1000),
    status              VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    valid_until         TIMESTAMPTZ,
    version             BIGINT         NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_load ON offers (load_id);
CREATE INDEX idx_offers_created_by ON offers (created_by_user_id);
CREATE INDEX idx_offers_status ON offers (status);

CREATE UNIQUE INDEX idx_offers_one_pending_per_user_load
    ON offers (load_id, created_by_user_id)
    WHERE status = 'PENDING';
