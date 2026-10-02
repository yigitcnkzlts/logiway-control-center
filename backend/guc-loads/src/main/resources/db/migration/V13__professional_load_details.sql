ALTER TABLE loads
    ADD COLUMN load_type VARCHAR(80),
    ADD COLUMN pallet_count INTEGER,
    ADD COLUMN packaging_type VARCHAR(80),
    ADD COLUMN cargo_value NUMERIC(14,2),
    ADD COLUMN contact_person VARCHAR(120),
    ADD COLUMN contact_phone VARCHAR(32),
    ADD COLUMN reference_no VARCHAR(100),
    ADD COLUMN door_ramp VARCHAR(100),
    ADD COLUMN adr BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN un_number VARCHAR(16),
    ADD COLUMN cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN temperature_min NUMERIC(6,2),
    ADD COLUMN temperature_max NUMERIC(6,2),
    ADD COLUMN tail_lift BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN forklift BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN customs_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN customs_reference VARCHAR(100),
    ADD COLUMN insurance_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN expected_price NUMERIC(14,2);

ALTER TABLE loads
    ADD CONSTRAINT chk_load_pallet_count CHECK (pallet_count IS NULL OR pallet_count >= 0),
    ADD CONSTRAINT chk_load_temperature CHECK (temperature_min IS NULL OR temperature_max IS NULL OR temperature_min <= temperature_max),
    ADD CONSTRAINT chk_load_values CHECK ((cargo_value IS NULL OR cargo_value >= 0) AND (expected_price IS NULL OR expected_price >= 0));
