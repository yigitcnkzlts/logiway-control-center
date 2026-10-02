package com.guclogistics.offers.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OfferRoundResponse(UUID id, int roundNumber, BigDecimal amount, String currency,
        String proposedBy, UUID proposedByUserId, String message, String status, long version, Instant createdAt) {
}
