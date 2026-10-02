package com.guclogistics.drivers.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateDriverProfileRequest(
        @Size(max = 50) String licenseNumber,
        @Size(min = 2, max = 2) String licenseCountry,
        @Min(0) Integer yearsExperience,
        UUID companyId
) {
}
