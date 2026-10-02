package com.guclogistics.companies.application.dto;

import com.guclogistics.companies.domain.CompanyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCompanyRequest(
        @NotNull CompanyType type,
        @NotBlank @Size(max = 255) String legalName,
        @Size(max = 255) String tradeName,
        @Size(max = 50) String vatNumber,
        @NotBlank @Size(min = 2, max = 2) String country
) {
}
