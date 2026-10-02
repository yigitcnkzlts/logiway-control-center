package com.guclogistics.identity.application.dto;

import java.time.Instant;
import java.util.UUID;

public record DeviceResponse(
        UUID id,
        String platform,
        String deviceName,
        Instant lastSeenAt,
        boolean trusted
) {
}
