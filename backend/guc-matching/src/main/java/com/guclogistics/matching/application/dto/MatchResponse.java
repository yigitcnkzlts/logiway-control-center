package com.guclogistics.matching.application.dto;

import com.guclogistics.matching.domain.MatchStatus;

import java.time.Instant;
import java.util.UUID;

public record MatchResponse(
        UUID id,
        UUID loadId,
        UUID offerId,
        MatchStatus status,
        Instant matchedAt,
        Instant createdAt
) {
}
