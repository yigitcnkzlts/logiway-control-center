package com.guclogistics.verification.application.dto;

import java.time.Instant;
import java.util.UUID;

public record VerificationDocumentResponse(
        UUID id,
        String docType,
        String mime,
        long sizeBytes,
        String checksumSha256,
        Instant createdAt
) {
}
