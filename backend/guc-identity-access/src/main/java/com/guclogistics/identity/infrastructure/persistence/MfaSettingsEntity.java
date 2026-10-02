package com.guclogistics.identity.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mfa_settings")
@Getter
@Setter
public class MfaSettingsEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "totp_secret_enc", nullable = false, columnDefinition = "TEXT")
    private String totpSecretEnc;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
