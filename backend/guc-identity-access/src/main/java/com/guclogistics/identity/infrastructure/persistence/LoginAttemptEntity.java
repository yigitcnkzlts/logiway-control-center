package com.guclogistics.identity.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "login_attempts")
@Getter
@Setter
public class LoginAttemptEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 320)
    private String identifier;

    @Column(name = "ip_address", nullable = false, length = 64)
    private String ipAddress;

    @Column(nullable = false)
    private boolean success;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = Instant.now();
    }
}
