package com.guclogistics.vehicles.infrastructure.persistence;

import com.guclogistics.vehicles.domain.OwnerType;
import com.guclogistics.vehicles.domain.VehicleStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
public class VehicleEntity {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false, length = 20)
    private OwnerType ownerType;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 20)
    private String plate;

    @Column(length = 17)
    private String vin;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "capacity_kg", precision = 12, scale = 2)
    private BigDecimal capacityKg;

    @Column(name = "volume_m3", precision = 12, scale = 2)
    private BigDecimal volumeM3;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleStatus status = VehicleStatus.ACTIVE;

    @Column(name = "created_by_user_id", nullable = false)
    private UUID createdByUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
