ALTER TABLE offers
    ADD COLUMN vehicle_id UUID,
    ADD COLUMN vehicle_plate VARCHAR(32),
    ADD COLUMN vehicle_type VARCHAR(80),
    ADD COLUMN driver_name VARCHAR(120),
    ADD COLUMN driver_phone VARCHAR(32),
    ADD COLUMN estimated_transit_hours INTEGER,
    ADD COLUMN available_at TIMESTAMPTZ;

UPDATE offers
SET vehicle_plate = 'UNASSIGNED',
    vehicle_type = 'UNASSIGNED',
    driver_name = 'UNASSIGNED',
    driver_phone = 'UNASSIGNED'
WHERE vehicle_plate IS NULL;

ALTER TABLE offers
    ALTER COLUMN vehicle_plate SET NOT NULL,
    ALTER COLUMN vehicle_type SET NOT NULL,
    ALTER COLUMN driver_name SET NOT NULL,
    ALTER COLUMN driver_phone SET NOT NULL;

ALTER TABLE offers
    ADD CONSTRAINT chk_offer_transit_hours
        CHECK (estimated_transit_hours IS NULL OR estimated_transit_hours > 0);
