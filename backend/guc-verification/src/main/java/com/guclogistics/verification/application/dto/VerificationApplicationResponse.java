package com.guclogistics.verification.application.dto;

import com.guclogistics.verification.domain.ApplicationStatus;
import com.guclogistics.verification.domain.SubjectType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record VerificationApplicationResponse(
        UUID id,
        SubjectType subjectType,
        UUID subjectId,
        ApplicationStatus status,
        Instant submittedAt,
        UUID reviewedBy,
        String decisionReason,
        UUID applicantUserId,
        List<VerificationDocumentResponse> documents,
        Instant createdAt,
        Instant updatedAt
) {
}
