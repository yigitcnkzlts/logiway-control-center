package com.guclogistics.vehicles.application.dto;

import com.guclogistics.vehicles.domain.VehicleStatus;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateVehicleRequest(
        @Size(max = 20) String plate,
        @Size(max = 17) String vin,
        @Size(max = 50) String type,
        BigDecimal capacityKg,
        BigDecimal volumeM3,
        VehicleStatus status
) {
}
