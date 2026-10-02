package com.guclogistics.loads.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public record UpdateLoadRequest(
        @Size(max = 200) String title,
        @Size(max = 5000) String description,
        @Size(min = 2, max = 2) String pickupCountry,
        @Size(max = 100) String pickupCity,
        @Size(max = 500) String pickupAddress,
        Double pickupLat,
        Double pickupLng,
        @Size(min = 2, max = 2) String dropoffCountry,
        @Size(max = 100) String dropoffCity,
        @Size(max = 500) String dropoffAddress,
        Double dropoffLat,
        Double dropoffLng,
        Instant readyFrom,
        Instant readyTo,
        @DecimalMin("0.01") BigDecimal weightKg,
        @DecimalMin("0") BigDecimal volumeM3,
        @Size(max = 500) String vehicleRequirements,
        @Size(min = 3, max = 3) String currency
) {
}
