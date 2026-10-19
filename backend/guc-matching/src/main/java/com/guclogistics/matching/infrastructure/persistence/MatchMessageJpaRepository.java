package com.guclogistics.matching.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MatchMessageJpaRepository extends JpaRepository<MatchMessageEntity, UUID> {
    List<MatchMessageEntity> findByMatchIdOrderByCreatedAtAsc(UUID matchId);
}
