package com.guclogistics.identity.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MfaSettingsJpaRepository extends JpaRepository<MfaSettingsEntity, UUID> {
}
