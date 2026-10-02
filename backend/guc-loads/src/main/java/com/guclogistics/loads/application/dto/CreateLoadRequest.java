package com.guclogistics.loads.application.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CreateLoadRequest(
        @NotNull UUID shipperCompanyId,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        @NotBlank @Size(min = 2, max = 2) String pickupCountry,
        @NotBlank @Size(max = 100) String pickupCity,
        @Size(max = 500) String pickupAddress,
        Double pickupLat,
        Double pickupLng,
        @NotBlank @Size(min = 2, max = 2) String dropoffCountry,
        @NotBlank @Size(max = 100) String dropoffCity,
        @Size(max = 500) String dropoffAddress,
        Double dropoffLat,
        Double dropoffLng,
        @NotNull Instant readyFrom,
        @NotNull Instant readyTo,
        @NotNull @DecimalMin("0.01") BigDecimal weightKg,
        @DecimalMin("0") BigDecimal volumeM3,
        @Size(max = 500) String vehicleRequirements,
        @NotBlank @Size(min = 3, max = 3) String currency,
        @Size(max = 80) String loadType,
        @PositiveOrZero Integer palletCount,
        @Size(max = 80) String packagingType,
        @DecimalMin("0") BigDecimal cargoValue,
        @Size(max = 120) String contactPerson,
        @Size(max = 32) String contactPhone,
        @Size(max = 100) String referenceNo,
        @Size(max = 100) String doorRamp,
        Boolean adr,
        @Size(max = 16) String unNumber,
        Boolean coldChain,
        BigDecimal temperatureMin,
        BigDecimal temperatureMax,
        Boolean tailLift,
        Boolean forklift,
        Boolean customsRequired,
        @Size(max = 100) String customsReference,
        Boolean insuranceRequired,
        @DecimalMin("0") BigDecimal expectedPrice
) {
    public CreateLoadRequest(
            UUID shipperCompanyId, String title, String description,
            String pickupCountry, String pickupCity, String pickupAddress, Double pickupLat, Double pickupLng,
            String dropoffCountry, String dropoffCity, String dropoffAddress, Double dropoffLat, Double dropoffLng,
            Instant readyFrom, Instant readyTo, BigDecimal weightKg, BigDecimal volumeM3,
            String vehicleRequirements, String currency
    ) {
        this(shipperCompanyId, title, description, pickupCountry, pickupCity, pickupAddress, pickupLat, pickupLng,
                dropoffCountry, dropoffCity, dropoffAddress, dropoffLat, dropoffLng, readyFrom, readyTo,
                weightKg, volumeM3, vehicleRequirements, currency, null, null, null, null, null, null,
                null, null, false, null, false, null, null, false, false, false, null, false, null);
    }
}
