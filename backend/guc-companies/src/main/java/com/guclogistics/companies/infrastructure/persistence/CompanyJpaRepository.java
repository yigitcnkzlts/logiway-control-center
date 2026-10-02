package com.guclogistics.companies.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyJpaRepository extends JpaRepository<CompanyEntity, UUID> {

    @Query("""
            SELECT c FROM CompanyEntity c
            JOIN CompanyMemberEntity m ON m.companyId = c.id
            WHERE m.userId = :userId
            ORDER BY c.createdAt DESC
            """)
    List<CompanyEntity> findByMemberUserId(@Param("userId") UUID userId);

    @Modifying
    @Query(value = "UPDATE companies SET status = :status, updated_at = NOW() WHERE id = :id", nativeQuery = true)
    int updateStatus(@Param("id") UUID id, @Param("status") String status);

    Optional<CompanyEntity> findByIdAndCreatedByUserId(UUID id, UUID createdByUserId);
}
