package com.guclogistics.vehicles.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VehicleJpaRepository extends JpaRepository<VehicleEntity, UUID> {

    List<VehicleEntity> findByCreatedByUserIdOrderByCreatedAtDesc(UUID createdByUserId);

    Optional<VehicleEntity> findByIdAndCreatedByUserId(UUID id, UUID createdByUserId);

    @Query(value = """
            SELECT v.* FROM vehicles v WHERE v.created_by_user_id=:userId OR
              (v.owner_type='COMPANY' AND EXISTS (SELECT 1 FROM company_members cm
                WHERE cm.company_id=v.owner_id AND cm.user_id=:userId))
            ORDER BY v.created_at DESC
            """, nativeQuery = true)
    List<VehicleEntity> findAccessible(@Param("userId") UUID userId);

    @Query(value = """
            SELECT v.* FROM vehicles v WHERE v.id=:id AND (v.created_by_user_id=:userId OR
              (v.owner_type='COMPANY' AND EXISTS (SELECT 1 FROM company_members cm
                WHERE cm.company_id=v.owner_id AND cm.user_id=:userId)))
            """, nativeQuery = true)
    Optional<VehicleEntity> findAccessibleById(@Param("id") UUID id, @Param("userId") UUID userId);
}
