package com.guclogistics.identity.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface LoginAttemptJpaRepository extends JpaRepository<LoginAttemptEntity, UUID> {

    @Query("""
            SELECT COUNT(a) FROM LoginAttemptEntity a
            WHERE a.identifier = :identifier AND a.success = false AND a.createdAt >= :since
            """)
    long countFailedSince(@Param("identifier") String identifier, @Param("since") Instant since);
}
