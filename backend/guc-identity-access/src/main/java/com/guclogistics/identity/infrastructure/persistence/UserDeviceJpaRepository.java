package com.guclogistics.identity.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserDeviceJpaRepository extends JpaRepository<UserDeviceEntity, UUID> {
    Optional<UserDeviceEntity> findByUserIdAndDeviceFingerprint(UUID userId, String deviceFingerprint);
    List<UserDeviceEntity> findByUserIdOrderByLastSeenAtDesc(UUID userId);
}
