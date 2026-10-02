package com.guclogistics.identity.application.dto;

import java.time.Instant;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        UUID deviceId,
        String ipAddress,
        String userAgent,
        Instant createdAt,
        Instant expiresAt,
        boolean current
) {
}
