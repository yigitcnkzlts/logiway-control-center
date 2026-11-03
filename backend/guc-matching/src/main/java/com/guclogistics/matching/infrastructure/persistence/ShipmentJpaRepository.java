package com.guclogistics.matching.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShipmentJpaRepository extends JpaRepository<ShipmentEntity, UUID> {
    Optional<ShipmentEntity> findByMatchId(UUID matchId);

    @Query(value = """
            SELECT s.* FROM shipments s
            WHERE EXISTS (
                SELECT 1 FROM company_members cm
                WHERE cm.user_id = :userId
                  AND (cm.company_id = s.shipper_company_id OR cm.company_id = s.carrier_company_id)
            ) OR EXISTS (
                SELECT 1 FROM driver_profiles dp
                WHERE dp.id = s.driver_profile_id AND dp.user_id = :userId
            )
            ORDER BY s.updated_at DESC
            """, nativeQuery = true)
    List<ShipmentEntity> findAccessibleForUser(@Param("userId") UUID userId);
}
