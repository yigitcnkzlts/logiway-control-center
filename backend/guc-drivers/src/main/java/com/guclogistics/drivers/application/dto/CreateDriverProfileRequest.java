package com.guclogistics.drivers.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDriverProfileRequest(
        @NotBlank @Size(max = 50) String licenseNumber,
        @NotBlank @Size(min = 2, max = 2) String licenseCountry,
        @Min(0) int yearsExperience,
        UUID companyId
) {
}
