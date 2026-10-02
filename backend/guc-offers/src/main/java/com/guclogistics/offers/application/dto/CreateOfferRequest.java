package com.guclogistics.offers.application.dto;

import com.guclogistics.offers.domain.OffererType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CreateOfferRequest(
        @NotNull OffererType offererType,
        UUID offererId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank @Size(min = 3, max = 3) String currency,
        @Size(max = 1000) String message,
        Instant validUntil,
        @NotNull UUID vehicleId,
        @NotNull UUID driverProfileId,
        @Size(max = 32) String vehiclePlate,
        @Size(max = 80) String vehicleType,
        @Size(max = 120) String driverName,
        @Size(max = 32) String driverPhone,
        @Positive Integer estimatedTransitHours,
        Instant availableAt
) {
    public CreateOfferRequest(
            OffererType offererType, UUID offererId, BigDecimal amount, String currency, String message,
            Instant validUntil, UUID vehicleId, String vehiclePlate, String vehicleType,
            String driverName, String driverPhone, Integer estimatedTransitHours, Instant availableAt
    ) {
        this(offererType, offererId, amount, currency, message, validUntil, vehicleId, null,
                vehiclePlate, vehicleType, driverName, driverPhone, estimatedTransitHours, availableAt);
    }

    public CreateOfferRequest(
            OffererType offererType, UUID offererId, BigDecimal amount,
            String currency, String message, Instant validUntil
    ) {
        this(offererType, offererId, amount, currency, message, validUntil,
                null, null, null, null, null, null, null, null);
    }
}
