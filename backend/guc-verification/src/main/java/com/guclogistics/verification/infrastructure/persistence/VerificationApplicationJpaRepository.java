package com.guclogistics.verification.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VerificationApplicationJpaRepository extends JpaRepository<VerificationApplicationEntity, UUID> {

    @Query("""
            SELECT DISTINCT a FROM VerificationApplicationEntity a
            LEFT JOIN FETCH a.documents
            WHERE a.applicantUserId = :applicantUserId
            ORDER BY a.createdAt DESC
            """)
    List<VerificationApplicationEntity> findByApplicantUserIdOrderByCreatedAtDesc(
            @Param("applicantUserId") UUID applicantUserId
    );

    Optional<VerificationApplicationEntity> findByIdAndApplicantUserId(UUID id, UUID applicantUserId);
}
