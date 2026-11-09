-- Cross-module foreign keys were intentionally absent from the first module-local migrations.
-- NOT VALID preserves existing rows and avoids a full table scan during deployment while every
-- new or updated row is checked immediately. A later audited migration can VALIDATE each
-- constraint after production orphan checks have been completed.

ALTER TABLE companies
    ADD CONSTRAINT fk_companies_created_by_user
    FOREIGN KEY (created_by_user_id) REFERENCES users (id) NOT VALID;

ALTER TABLE company_members
    ADD CONSTRAINT fk_company_members_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT VALID;

ALTER TABLE driver_profiles
    ADD CONSTRAINT fk_driver_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT VALID,
    ADD CONSTRAINT fk_driver_profiles_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL NOT VALID;

ALTER TABLE vehicles
    ADD CONSTRAINT fk_vehicles_created_by_user
    FOREIGN KEY (created_by_user_id) REFERENCES users (id) NOT VALID;

ALTER TABLE loads
    ADD CONSTRAINT fk_loads_shipper_company
    FOREIGN KEY (shipper_company_id) REFERENCES companies (id) NOT VALID,
    ADD CONSTRAINT fk_loads_created_by_user
    FOREIGN KEY (created_by_user_id) REFERENCES users (id) NOT VALID;

ALTER TABLE load_status_history
    ADD CONSTRAINT fk_load_status_history_changed_by_user
    FOREIGN KEY (changed_by) REFERENCES users (id) NOT VALID;

ALTER TABLE offers
    ADD CONSTRAINT fk_offers_load
    FOREIGN KEY (load_id) REFERENCES loads (id) ON DELETE CASCADE NOT VALID,
    ADD CONSTRAINT fk_offers_created_by_user
    FOREIGN KEY (created_by_user_id) REFERENCES users (id) NOT VALID,
    ADD CONSTRAINT fk_offers_driver_profile
    FOREIGN KEY (driver_profile_id) REFERENCES driver_profiles (id) NOT VALID;

ALTER TABLE offer_rounds
    ADD CONSTRAINT fk_offer_rounds_proposed_by_user
    FOREIGN KEY (proposed_by_user_id) REFERENCES users (id) NOT VALID;

ALTER TABLE matches
    ADD CONSTRAINT fk_matches_load
    FOREIGN KEY (load_id) REFERENCES loads (id) NOT VALID,
    ADD CONSTRAINT fk_matches_offer
    FOREIGN KEY (offer_id) REFERENCES offers (id) NOT VALID;

ALTER TABLE shipments
    ADD CONSTRAINT fk_shipments_shipper_company
    FOREIGN KEY (shipper_company_id) REFERENCES companies (id) NOT VALID,
    ADD CONSTRAINT fk_shipments_carrier_company
    FOREIGN KEY (carrier_company_id) REFERENCES companies (id) NOT VALID,
    ADD CONSTRAINT fk_shipments_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) NOT VALID,
    ADD CONSTRAINT fk_shipments_driver_profile
    FOREIGN KEY (driver_profile_id) REFERENCES driver_profiles (id) NOT VALID;

ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT VALID;
