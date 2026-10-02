package com.guclogistics.matching.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MatchDetailResponse(
        UUID id, String status, UUID loadId, UUID offerId, String loadTitle,
        String pickupCity, String pickupCountry, String dropoffCity, String dropoffCountry,
        BigDecimal agreedAmount, String currency, UUID shipperCompanyId, String shipperName,
        UUID carrierCompanyId, String carrierName, UUID vehicleId, String vehiclePlate, String vehicleType,
        UUID driverProfileId, String driverName, String shipperPhone, String carrierPhone,
        ShipmentResponse shipment, Instant matchedAt, Instant createdAt) {
}
