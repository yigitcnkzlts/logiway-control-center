package com.guclogistics.identity.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MfaRecoveryCodeJpaRepository extends JpaRepository<MfaRecoveryCodeEntity, UUID> {
    List<MfaRecoveryCodeEntity> findByUserIdAndUsedAtIsNull(UUID userId);
}
