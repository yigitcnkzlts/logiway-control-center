CREATE TABLE loads (
    id                    UUID PRIMARY KEY,
    shipper_company_id    UUID           NOT NULL,
    created_by_user_id    UUID           NOT NULL,
    title                 VARCHAR(200)   NOT NULL,
    description           TEXT,
    pickup_country        CHAR(2)        NOT NULL,
    pickup_city           VARCHAR(100)   NOT NULL,
    pickup_address        VARCHAR(500),
    pickup_lat            DOUBLE PRECISION,
    pickup_lng            DOUBLE PRECISION,
    dropoff_country       CHAR(2)        NOT NULL,
    dropoff_city          VARCHAR(100)   NOT NULL,
    dropoff_address       VARCHAR(500),
    dropoff_lat           DOUBLE PRECISION,
    dropoff_lng           DOUBLE PRECISION,
    ready_from            TIMESTAMPTZ    NOT NULL,
    ready_to              TIMESTAMPTZ    NOT NULL,
    weight_kg             NUMERIC(12, 2) NOT NULL,
    volume_m3             NUMERIC(12, 2),
    vehicle_requirements  VARCHAR(500),
    currency              CHAR(3)        NOT NULL,
    status                VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',
    version               BIGINT         NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loads_shipper_company ON loads (shipper_company_id);
CREATE INDEX idx_loads_created_by ON loads (created_by_user_id);
CREATE INDEX idx_loads_status ON loads (status);
CREATE INDEX idx_loads_pickup_country ON loads (pickup_country);
CREATE INDEX idx_loads_dropoff_country ON loads (dropoff_country);

CREATE TABLE load_status_history (
    id          UUID PRIMARY KEY,
    load_id     UUID        NOT NULL REFERENCES loads (id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status   VARCHAR(20) NOT NULL,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by  UUID        NOT NULL
);

CREATE INDEX idx_load_status_history_load ON load_status_history (load_id);
