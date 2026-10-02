package com.guclogistics.shared.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public record AuthenticatedUser(
        UUID userId,
        UUID sessionId,
        String email,
        Set<String> roles,
        boolean mfaVerified
) {
    public static Optional<AuthenticatedUser> current() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            return Optional.empty();
        }
        return Optional.of(user);
    }

    public static AuthenticatedUser requireCurrent() {
        return current().orElseThrow(() -> new IllegalStateException("No authenticated user"));
    }

    public boolean hasRole(String role) {
        return roles.contains(role) || roles.contains("ROLE_" + role);
    }
}
