-- Hibernate maps length-limited String fields to VARCHAR. Keep the Flyway
-- schema consistent with those mappings so ddl-auto=validate can start.
ALTER TABLE companies
    ALTER COLUMN country TYPE VARCHAR(2);

ALTER TABLE driver_profiles
    ALTER COLUMN license_country TYPE VARCHAR(2);

ALTER TABLE loads
    ALTER COLUMN pickup_country TYPE VARCHAR(2),
    ALTER COLUMN dropoff_country TYPE VARCHAR(2),
    ALTER COLUMN currency TYPE VARCHAR(3);

ALTER TABLE offers
    ALTER COLUMN currency TYPE VARCHAR(3);

ALTER TABLE offer_rounds
    ALTER COLUMN currency TYPE VARCHAR(3);

ALTER TABLE payment_ledger
    ALTER COLUMN currency TYPE VARCHAR(3);
