package com.guclogistics.companies.application.dto;

import com.guclogistics.companies.domain.MemberRole;
import jakarta.validation.constraints.NotNull;

public record UpdateCompanyMemberRoleRequest(@NotNull MemberRole role) {
}
