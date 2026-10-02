CREATE TABLE vehicles (
    id                  UUID PRIMARY KEY,
    owner_type          VARCHAR(20)  NOT NULL,
    owner_id            UUID         NOT NULL,
    plate               VARCHAR(20)  NOT NULL,
    vin                 VARCHAR(17),
    type                VARCHAR(50)  NOT NULL,
    capacity_kg         NUMERIC(12, 2),
    volume_m3           NUMERIC(12, 2),
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_by_user_id  UUID         NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_created_by ON vehicles (created_by_user_id);
CREATE INDEX idx_vehicles_owner ON vehicles (owner_type, owner_id);
