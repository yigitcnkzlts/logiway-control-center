package com.guclogistics.companies.application.dto;

import com.guclogistics.companies.domain.InvitationStatus;
import com.guclogistics.companies.domain.MemberRole;

import java.time.Instant;
import java.util.UUID;

public record CompanyInvitationResponse(UUID id, UUID companyId, String email, MemberRole role,
                                        InvitationStatus status, Instant expiresAt, Instant createdAt) {
}
