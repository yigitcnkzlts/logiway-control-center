package com.guclogistics.companies.application.dto;

import com.guclogistics.companies.domain.MemberRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InviteCompanyMemberRequest(
        @NotBlank @Email @Size(max = 320) String email,
        @NotNull MemberRole role) {
}
