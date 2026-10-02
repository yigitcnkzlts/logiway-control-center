package com.guclogistics.verification.application.dto;

import com.guclogistics.verification.domain.SubjectType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateVerificationApplicationRequest(
        @NotNull SubjectType subjectType,
        @NotNull UUID subjectId
) {
}
