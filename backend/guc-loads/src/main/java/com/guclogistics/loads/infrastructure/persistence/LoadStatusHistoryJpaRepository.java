package com.guclogistics.loads.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface LoadStatusHistoryJpaRepository extends JpaRepository<LoadStatusHistoryEntity, UUID> {
}
