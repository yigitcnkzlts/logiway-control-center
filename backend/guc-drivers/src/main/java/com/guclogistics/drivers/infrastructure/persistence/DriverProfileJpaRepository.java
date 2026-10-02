package com.guclogistics.drivers.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface DriverProfileJpaRepository extends JpaRepository<DriverProfileEntity, UUID> {

    Optional<DriverProfileEntity> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    @Modifying
    @Query(value = "UPDATE driver_profiles SET status = :status, updated_at = NOW() WHERE id = :id", nativeQuery = true)
    int updateStatus(@Param("id") UUID id, @Param("status") String status);
}
