package com.guclogistics.identity.infrastructure.security;

import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-secret-must-be-at-least-32-bytes-long!!";

    private JwtService jwtService;
    private JwtProperties properties;

    @BeforeEach
    void setUp() {
        properties = new JwtProperties();
        properties.setSecret(SECRET);
        properties.setIssuer("guclogistics");
        properties.setAudience("guclogistics-api");
        properties.setAccessTokenMinutes(15);
        properties.setMfaTokenMinutes(5);
        jwtService = new JwtService(properties);
    }

    @Test
    void createAccessTokenAndParseRoundTrip() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        String email = "user@example.com";
        Set<String> roles = Set.of("SHIPPER");

        String token = jwtService.createAccessToken(userId, sessionId, email, roles, true);

        Claims claims = jwtService.parseAndValidate(token);
        assertThat(claims.getSubject()).isEqualTo(userId.toString());
        assertThat(claims.get(JwtService.CLAIM_SESSION, String.class)).isEqualTo(sessionId.toString());
        assertThat(claims.get(JwtService.CLAIM_TOKEN_TYPE, String.class)).isEqualTo(JwtService.TYPE_ACCESS);
        assertThat(claims.get(JwtService.CLAIM_MFA, Boolean.class)).isTrue();
        assertThat(claims.get("email", String.class)).isEqualTo(email);
        assertThat(jwtService.extractRoles(claims)).containsExactlyInAnyOrder("SHIPPER");
    }

    @Test
    void createMfaChallengeTokenHasMfaType() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.createMfaChallengeToken(userId, "mfa@example.com");
        Claims claims = jwtService.parseAndValidate(token);

        assertThat(claims.get(JwtService.CLAIM_TOKEN_TYPE, String.class)).isEqualTo(JwtService.TYPE_MFA);
        assertThat(claims.getSubject()).isEqualTo(userId.toString());
        assertThat(claims.get("email", String.class)).isEqualTo("mfa@example.com");
        assertThat(claims.get(JwtService.CLAIM_ROLES)).isNull();
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtService.createAccessToken(
                UUID.randomUUID(), UUID.randomUUID(), "a@b.com", Set.of("ADMIN"), false);

        assertThatThrownBy(() -> jwtService.parseAndValidate(token + "x"))
                .isInstanceOf(DomainException.class)
                .satisfies(ex -> {
                    DomainException de = (DomainException) ex;
                    assertThat(de.getErrorCode()).isEqualTo(ErrorCode.TOKEN_INVALID);
                });
    }

    @Test
    void rejectsTokenSignedWithDifferentSecret() {
        JwtProperties otherProps = new JwtProperties();
        otherProps.setSecret("other-secret-must-be-at-least-32-bytes!!");
        otherProps.setIssuer("guclogistics");
        otherProps.setAudience("guclogistics-api");
        JwtService otherService = new JwtService(otherProps);

        String token = otherService.createAccessToken(
                UUID.randomUUID(), UUID.randomUUID(), "a@b.com", Set.of("ADMIN"), false);

        assertThatThrownBy(() -> jwtService.parseAndValidate(token))
                .isInstanceOf(DomainException.class);
    }

    @Test
    void extractRolesReturnsEmptyWhenMissing() {
        String token = jwtService.createMfaChallengeToken(UUID.randomUUID(), "a@b.com");
        Claims claims = jwtService.parseAndValidate(token);
        assertThat(jwtService.extractRoles(claims)).isEmpty();
    }
}
