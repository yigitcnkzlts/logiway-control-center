ALTER TABLE offers ADD COLUMN driver_profile_id UUID;

CREATE TABLE offer_rounds (
    id UUID PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number > 0),
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL,
    proposed_by VARCHAR(20) NOT NULL,
    proposed_by_user_id UUID NOT NULL,
    message VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (offer_id, round_number)
);

CREATE UNIQUE INDEX idx_offer_round_open
    ON offer_rounds(offer_id) WHERE status = 'OPEN';

CREATE TABLE shipments (
    id UUID PRIMARY KEY,
    load_id UUID NOT NULL UNIQUE REFERENCES loads(id),
    accepted_offer_id UUID NOT NULL UNIQUE REFERENCES offers(id),
    match_id UUID NOT NULL UNIQUE REFERENCES matches(id),
    shipper_company_id UUID NOT NULL,
    carrier_company_id UUID,
    vehicle_id UUID NOT NULL,
    driver_profile_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_shipments_active_vehicle
    ON shipments(vehicle_id) WHERE status IN ('CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT');
CREATE UNIQUE INDEX idx_shipments_active_driver
    ON shipments(driver_profile_id) WHERE status IN ('CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT');
