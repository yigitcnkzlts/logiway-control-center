package com.guclogistics.identity.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSessionJpaRepository extends JpaRepository<UserSessionEntity, UUID> {

    Optional<UserSessionEntity> findByRefreshTokenHashAndRevokedAtIsNull(String refreshTokenHash);

    Optional<UserSessionEntity> findByRefreshTokenHash(String refreshTokenHash);

    List<UserSessionEntity> findByUserIdAndRevokedAtIsNullOrderByCreatedAtDesc(UUID userId);

    @Modifying
    @Query("UPDATE UserSessionEntity s SET s.revokedAt = :now WHERE s.familyId = :familyId AND s.revokedAt IS NULL")
    int revokeFamily(@Param("familyId") UUID familyId, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE UserSessionEntity s SET s.revokedAt = :now WHERE s.id = :id AND s.userId = :userId AND s.revokedAt IS NULL")
    int revokeByIdAndUser(@Param("id") UUID id, @Param("userId") UUID userId, @Param("now") Instant now);
}
