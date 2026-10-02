package com.guclogistics.matching.application.dto;

import com.guclogistics.matching.domain.ShipmentStatus;

import java.time.Instant;
import java.util.UUID;

public record ShipmentResponse(UUID id, UUID loadId, UUID acceptedOfferId, UUID matchId,
        UUID shipperCompanyId, UUID carrierCompanyId, UUID vehicleId, UUID driverProfileId,
        ShipmentStatus status, long version, Instant createdAt, Instant updatedAt) {
}
