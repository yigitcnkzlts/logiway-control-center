package com.guclogistics.matching.infrastructure.persistence;

import com.guclogistics.matching.domain.MatchStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "matches")
@Getter
@Setter
public class MatchEntity {

    @Id
    private UUID id;

    @Column(name = "load_id", nullable = false, unique = true)
    private UUID loadId;

    @Column(name = "offer_id", nullable = false, unique = true)
    private UUID offerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatchStatus status = MatchStatus.ACTIVE;

    @Column(name = "matched_at", nullable = false)
    private Instant matchedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        if (matchedAt == null) {
            matchedAt = now;
        }
        createdAt = now;
    }
}
