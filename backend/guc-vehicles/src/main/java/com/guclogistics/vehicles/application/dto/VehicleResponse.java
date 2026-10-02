package com.guclogistics.vehicles.application.dto;

import com.guclogistics.vehicles.domain.OwnerType;
import com.guclogistics.vehicles.domain.VehicleStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record VehicleResponse(
        UUID id,
        OwnerType ownerType,
        UUID ownerId,
        String plate,
        String vin,
        String type,
        BigDecimal capacityKg,
        BigDecimal volumeM3,
        VehicleStatus status,
        UUID createdByUserId,
        Instant createdAt,
        Instant updatedAt
) {
}
