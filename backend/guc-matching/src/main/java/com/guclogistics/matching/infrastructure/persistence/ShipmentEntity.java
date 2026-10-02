package com.guclogistics.matching.infrastructure.persistence;

import com.guclogistics.matching.domain.ShipmentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shipments")
@Getter
@Setter
public class ShipmentEntity {
    @Id private UUID id;
    @Column(name = "load_id", nullable = false, unique = true) private UUID loadId;
    @Column(name = "accepted_offer_id", nullable = false, unique = true) private UUID acceptedOfferId;
    @Column(name = "match_id", nullable = false, unique = true) private UUID matchId;
    @Column(name = "shipper_company_id", nullable = false) private UUID shipperCompanyId;
    @Column(name = "carrier_company_id") private UUID carrierCompanyId;
    @Column(name = "vehicle_id", nullable = false) private UUID vehicleId;
    @Column(name = "driver_profile_id", nullable = false) private UUID driverProfileId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ShipmentStatus status;
    @Version @Column(nullable = false) private long version;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    @PrePersist void onCreate() {
        if (id == null) id = UUID.randomUUID();
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
}
