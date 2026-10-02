package com.guclogistics.matching.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ShipmentJpaRepository extends JpaRepository<ShipmentEntity, UUID> {
    Optional<ShipmentEntity> findByMatchId(UUID matchId);
}
