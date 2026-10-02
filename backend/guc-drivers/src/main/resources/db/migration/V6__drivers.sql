CREATE TABLE driver_profiles (
    id                UUID PRIMARY KEY,
    user_id           UUID         NOT NULL UNIQUE,
    license_number    VARCHAR(50)  NOT NULL,
    license_country   CHAR(2)      NOT NULL,
    years_experience  INT          NOT NULL DEFAULT 0,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    company_id        UUID,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_driver_profiles_status ON driver_profiles (status);
CREATE INDEX idx_driver_profiles_company ON driver_profiles (company_id);
