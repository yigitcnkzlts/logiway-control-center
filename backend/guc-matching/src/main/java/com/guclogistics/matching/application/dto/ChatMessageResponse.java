package com.guclogistics.matching.application.dto;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageResponse(UUID id, UUID matchId, UUID senderUserId, String senderRole,
                                  String body, Instant createdAt) {
}
