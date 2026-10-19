package com.guclogistics.matching.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "match_messages")
@Getter
@Setter
public class MatchMessageEntity {
    @Id private UUID id;
    @Column(name = "match_id", nullable = false) private UUID matchId;
    @Column(name = "sender_user_id", nullable = false) private UUID senderUserId;
    @Column(name = "sender_role", nullable = false, length = 20) private String senderRole;
    @Column(nullable = false, length = 2000) private String body;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
