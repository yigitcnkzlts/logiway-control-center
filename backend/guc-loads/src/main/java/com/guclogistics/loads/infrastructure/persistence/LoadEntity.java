package com.guclogistics.loads.infrastructure.persistence;

import com.guclogistics.loads.domain.LoadStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "loads")
@Getter
@Setter
public class LoadEntity {

    @Id
    private UUID id;

    @Column(name = "shipper_company_id", nullable = false)
    private UUID shipperCompanyId;

    @Column(name = "created_by_user_id", nullable = false)
    private UUID createdByUserId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "pickup_country", nullable = false, length = 2)
    private String pickupCountry;

    @Column(name = "pickup_city", nullable = false, length = 100)
    private String pickupCity;

    @Column(name = "pickup_address", length = 500)
    private String pickupAddress;

    @Column(name = "pickup_lat")
    private Double pickupLat;

    @Column(name = "pickup_lng")
    private Double pickupLng;

    @Column(name = "dropoff_country", nullable = false, length = 2)
    private String dropoffCountry;

    @Column(name = "dropoff_city", nullable = false, length = 100)
    private String dropoffCity;

    @Column(name = "dropoff_address", length = 500)
    private String dropoffAddress;

    @Column(name = "dropoff_lat")
    private Double dropoffLat;

    @Column(name = "dropoff_lng")
    private Double dropoffLng;

    @Column(name = "ready_from", nullable = false)
    private Instant readyFrom;

    @Column(name = "ready_to", nullable = false)
    private Instant readyTo;

    @Column(name = "weight_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "volume_m3", precision = 12, scale = 2)
    private BigDecimal volumeM3;

    @Column(name = "vehicle_requirements", length = 500)
    private String vehicleRequirements;

    @Column(name = "load_type", length = 80)
    private String loadType;
    @Column(name = "pallet_count")
    private Integer palletCount;
    @Column(name = "packaging_type", length = 80)
    private String packagingType;
    @Column(name = "cargo_value", precision = 14, scale = 2)
    private BigDecimal cargoValue;
    @Column(name = "contact_person", length = 120)
    private String contactPerson;
    @Column(name = "contact_phone", length = 32)
    private String contactPhone;
    @Column(name = "reference_no", length = 100)
    private String referenceNo;
    @Column(name = "door_ramp", length = 100)
    private String doorRamp;
    @Column(nullable = false)
    private boolean adr;
    @Column(name = "un_number", length = 16)
    private String unNumber;
    @Column(name = "cold_chain", nullable = false)
    private boolean coldChain;
    @Column(name = "temperature_min", precision = 6, scale = 2)
    private BigDecimal temperatureMin;
    @Column(name = "temperature_max", precision = 6, scale = 2)
    private BigDecimal temperatureMax;
    @Column(name = "tail_lift", nullable = false)
    private boolean tailLift;
    @Column(nullable = false)
    private boolean forklift;
    @Column(name = "customs_required", nullable = false)
    private boolean customsRequired;
    @Column(name = "customs_reference", length = 100)
    private String customsReference;
    @Column(name = "insurance_required", nullable = false)
    private boolean insuranceRequired;
    @Column(name = "expected_price", precision = 14, scale = 2)
    private BigDecimal expectedPrice;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LoadStatus status = LoadStatus.DRAFT;

    @Version
    @Column(nullable = false)
    private long version;

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
