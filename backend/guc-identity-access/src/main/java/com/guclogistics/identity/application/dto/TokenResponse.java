package com.guclogistics.identity.application.dto;

import java.util.Set;
import java.util.UUID;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        UUID userId,
        Set<String> roles,
        boolean mfaEnabled,
        boolean mfaRequired
) {
    public static TokenResponse of(String access, String refresh, long expiresIn, UUID userId, Set<String> roles, boolean mfaEnabled) {
        return new TokenResponse(access, refresh, "Bearer", expiresIn, userId, roles, mfaEnabled, false);
    }

    public static TokenResponse mfaChallenge(String mfaToken, UUID userId) {
        return new TokenResponse(mfaToken, null, "MfaChallenge", 300, userId, Set.of(), true, true);
    }
}
