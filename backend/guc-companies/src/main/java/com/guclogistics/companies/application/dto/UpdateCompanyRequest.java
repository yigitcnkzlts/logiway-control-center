package com.guclogistics.companies.application.dto;

import jakarta.validation.constraints.Size;

public record UpdateCompanyRequest(
        @Size(max = 255) String legalName,
        @Size(max = 255) String tradeName,
        @Size(max = 50) String vatNumber,
        @Size(min = 2, max = 2) String country
) {
}
