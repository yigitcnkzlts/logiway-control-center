package com.guclogistics.companies.application.dto;

import com.guclogistics.companies.domain.MemberRole;

import java.util.UUID;

public record CompanyMemberResponse(UUID userId, String email, String phone, MemberRole role) {
}
