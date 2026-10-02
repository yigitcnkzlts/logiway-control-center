package com.guclogistics.drivers.application.dto;

import com.guclogistics.drivers.domain.DriverStatus;

import java.time.Instant;
import java.util.UUID;

public record DriverProfileResponse(
        UUID id,
        UUID userId,
        String licenseNumber,
        String licenseCountry,
        int yearsExperience,
        DriverStatus status,
        UUID companyId,
        Instant createdAt,
        Instant updatedAt
) {
}
