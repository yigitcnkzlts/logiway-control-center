package com.guclogistics.shared.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthenticatedUserTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void currentReturnsEmptyWhenUnauthenticated() {
        assertThat(AuthenticatedUser.current()).isEmpty();
    }

    @Test
    void currentReturnsUserWhenAuthenticated() {
        AuthenticatedUser user = sampleUser(Set.of("SHIPPER"));
        setAuthentication(user);

        assertThat(AuthenticatedUser.current()).contains(user);
    }

    @Test
    void requireCurrentThrowsWhenMissing() {
        assertThatThrownBy(AuthenticatedUser::requireCurrent)
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void hasRoleChecksPlainAndPrefixedRoles() {
        AuthenticatedUser user = sampleUser(Set.of("ROLE_ADMIN"));
        assertThat(user.hasRole("ADMIN")).isTrue();
        assertThat(user.hasRole("SHIPPER")).isFalse();

        AuthenticatedUser plain = sampleUser(Set.of("SHIPPER"));
        assertThat(plain.hasRole("SHIPPER")).isTrue();
    }

    private static AuthenticatedUser sampleUser(Set<String> roles) {
        return new AuthenticatedUser(UUID.randomUUID(), UUID.randomUUID(), "u@example.com", roles, true);
    }

    private static void setAuthentication(AuthenticatedUser user) {
        var auth = new UsernamePasswordAuthenticationToken(user, null);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
