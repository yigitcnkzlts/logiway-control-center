package com.guclogistics.vehicles.application.dto;

import com.guclogistics.vehicles.domain.OwnerType;
import com.guclogistics.vehicles.domain.VehicleStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateVehicleRequest(
        @NotNull OwnerType ownerType,
        @NotNull UUID ownerId,
        @NotBlank @Size(max = 20) String plate,
        @Size(max = 17) String vin,
        @NotBlank @Size(max = 50) String type,
        BigDecimal capacityKg,
        BigDecimal volumeM3
) {
}
