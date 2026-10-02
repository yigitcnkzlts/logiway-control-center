package com.guclogistics.loads.application.dto;

import com.guclogistics.loads.domain.LoadStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LoadResponse(
        UUID id,
        UUID shipperCompanyId,
        UUID createdByUserId,
        String title,
        String description,
        String pickupCountry,
        String pickupCity,
        String pickupAddress,
        Double pickupLat,
        Double pickupLng,
        String dropoffCountry,
        String dropoffCity,
        String dropoffAddress,
        Double dropoffLat,
        Double dropoffLng,
        Instant readyFrom,
        Instant readyTo,
        BigDecimal weightKg,
        BigDecimal volumeM3,
        String vehicleRequirements,
        String loadType,
        Integer palletCount,
        String packagingType,
        BigDecimal cargoValue,
        String contactPerson,
        String contactPhone,
        String referenceNo,
        String doorRamp,
        boolean adr,
        String unNumber,
        boolean coldChain,
        BigDecimal temperatureMin,
        BigDecimal temperatureMax,
        boolean tailLift,
        boolean forklift,
        boolean customsRequired,
        String customsReference,
        boolean insuranceRequired,
        BigDecimal expectedPrice,
        String currency,
        LoadStatus status,
        long version,
        Instant createdAt,
        Instant updatedAt
) {
}
