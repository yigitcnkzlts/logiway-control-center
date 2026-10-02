package com.guclogistics.companies.application.dto;

import com.guclogistics.companies.domain.CompanyStatus;
import com.guclogistics.companies.domain.CompanyType;

import java.time.Instant;
import java.util.UUID;

public record CompanyResponse(
        UUID id,
        CompanyType type,
        String legalName,
        String tradeName,
        String vatNumber,
        String country,
        CompanyStatus status,
        UUID createdByUserId,
        Instant createdAt,
        Instant updatedAt
) {
}
