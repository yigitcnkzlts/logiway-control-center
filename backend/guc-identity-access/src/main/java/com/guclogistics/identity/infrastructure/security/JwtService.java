package com.guclogistics.identity.infrastructure.security;

import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JwtService {

    public static final String CLAIM_SESSION = "sid";
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_MFA = "mfa";
    public static final String CLAIM_TOKEN_TYPE = "typ";
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_MFA = "mfa";

    private final JwtProperties properties;

    public String createAccessToken(UUID userId, UUID sessionId, String email, Set<String> roles, boolean mfaVerified) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(properties.getAccessTokenMinutes() * 60);
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(properties.getIssuer())
                .audience().add(properties.getAudience()).and()
                .subject(userId.toString())
                .claim(CLAIM_SESSION, sessionId.toString())
                .claim(CLAIM_ROLES, roles.stream().toList())
                .claim(CLAIM_MFA, mfaVerified)
                .claim(CLAIM_TOKEN_TYPE, TYPE_ACCESS)
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey())
                .compact();
    }

    public String createMfaChallengeToken(UUID userId, String email) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(properties.getMfaTokenMinutes() * 60);
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(properties.getIssuer())
                .audience().add(properties.getAudience()).and()
                .subject(userId.toString())
                .claim(CLAIM_TOKEN_TYPE, TYPE_MFA)
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey())
                .compact();
    }

    public Claims parseAndValidate(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey())
                    .requireIssuer(properties.getIssuer())
                    .requireAudience(properties.getAudience())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception ex) {
            throw new DomainException(ErrorCode.TOKEN_INVALID, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }
    }

    @SuppressWarnings("unchecked")
    public Set<String> extractRoles(Claims claims) {
        Object roles = claims.get(CLAIM_ROLES);
        if (roles instanceof List<?> list) {
            return list.stream().map(Object::toString).collect(Collectors.toSet());
        }
        return Set.of();
    }

    private SecretKey signingKey() {
        byte[] keyBytes = properties.getSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
