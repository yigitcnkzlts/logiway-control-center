package com.guclogistics.identity.application;

import com.guclogistics.identity.application.dto.*;
import com.guclogistics.identity.domain.UserStatus;
import com.guclogistics.identity.domain.event.SessionRevokedEvent;
import com.guclogistics.identity.domain.event.SuspiciousLoginDetectedEvent;
import com.guclogistics.identity.domain.event.UserLoggedInEvent;
import com.guclogistics.identity.domain.event.UserRegisteredEvent;
import com.guclogistics.identity.infrastructure.persistence.*;
import com.guclogistics.identity.infrastructure.ratelimit.RateLimitService;
import com.guclogistics.identity.infrastructure.security.JwtProperties;
import com.guclogistics.identity.infrastructure.security.JwtService;
import com.guclogistics.identity.infrastructure.security.TokenHasher;
import com.guclogistics.shared.event.DomainEventPublisher;
import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.exception.ErrorCode;
import com.guclogistics.shared.featureflag.FeatureFlagService;
import com.guclogistics.shared.events.identity.UserCompanyRegistrationRequestedEvent;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 30;

    private final UserJpaRepository userRepository;
    private final RoleJpaRepository roleRepository;
    private final UserSessionJpaRepository sessionRepository;
    private final UserDeviceJpaRepository deviceRepository;
    private final MfaSettingsJpaRepository mfaSettingsRepository;
    private final LoginAttemptJpaRepository loginAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final TokenHasher tokenHasher;
    private final RateLimitService rateLimitService;
    private final FeatureFlagService featureFlagService;
    private final DomainEventPublisher eventPublisher;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public TokenResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        String ip = clientIp(httpRequest);
        rateLimitService.checkRegister(ip);

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw DomainException.conflict("Email already registered");
        }

        RoleEntity role = roleRepository.findByName(request.role())
                .orElseThrow(() -> DomainException.business("Role not found"));
        boolean companyAccount = "SHIPPER".equals(request.role()) || "LOGISTICS_COMPANY".equals(request.role())
                || "FLEET_OWNER".equals(request.role());
        if (companyAccount && (request.companyName() == null || request.companyName().isBlank()
                || request.companyCountry() == null || request.companyCountry().isBlank())) {
            throw DomainException.business("Company name and country are required for company accounts");
        }

        UserEntity user = new UserEntity();
        user.setEmail(request.email().trim().toLowerCase());
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(UserStatus.ACTIVE);
        user.setLocale(request.locale() != null ? request.locale() : "en");
        user.setTimezone(request.timezone() != null ? request.timezone() : "UTC");
        user.getRoles().add(role);
        userRepository.save(user);

        eventPublisher.publish(new UserRegisteredEvent(user.getId(), user.getEmail(), role.getName()));
        if (companyAccount) {
            eventPublisher.publish(new UserCompanyRegistrationRequestedEvent(
                    user.getId(), request.role(), request.companyName().trim(), request.companyCountry().toUpperCase()));
        }

        DeviceContext device = upsertDevice(user.getId(), request.deviceFingerprint(), request.platform(),
                request.deviceName());
        return issueTokens(user, device, ip, httpRequest.getHeader("User-Agent"), true, false);
    }

    @Transactional
    public TokenResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String ip = clientIp(httpRequest);
        String email = request.email().trim().toLowerCase();
        rateLimitService.checkLogin(email, ip);

        UserEntity user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            recordAttempt(email, ip, false);
            throw new DomainException(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            throw new DomainException(ErrorCode.ACCOUNT_LOCKED, "Account temporarily locked", HttpStatus.LOCKED);
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            recordAttempt(email, ip, false);
            long failures = loginAttemptRepository.countFailedSince(email, Instant.now().minus(15, ChronoUnit.MINUTES));
            if (failures >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(Instant.now().plus(LOCKOUT_MINUTES, ChronoUnit.MINUTES));
                userRepository.save(user);
                eventPublisher.publish(new SuspiciousLoginDetectedEvent(user.getId(), ip, "Brute force lockout"));
            }
            throw new DomainException(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw DomainException.forbidden("User account is not active");
        }

        recordAttempt(email, ip, true);
        user.setLockedUntil(null);
        userRepository.save(user);

        boolean mfaEnabled = mfaSettingsRepository.findById(user.getId())
                .map(MfaSettingsEntity::isEnabled)
                .orElse(false);
        boolean mfaRequired = mfaEnabled || featureFlagService.isEnabled("mfa.required");

        if (mfaRequired) {
            String mfaToken = jwtService.createMfaChallengeToken(user.getId(), user.getEmail());
            return TokenResponse.mfaChallenge(mfaToken, user.getId());
        }

        DeviceContext device = upsertDevice(user.getId(), request.deviceFingerprint(), request.platform(),
                request.deviceName());
        boolean newDevice = device.newDevice();
        if (newDevice) {
            eventPublisher.publish(new SuspiciousLoginDetectedEvent(user.getId(), ip, "Login from new device"));
        }
        return issueTokens(user, device, ip, httpRequest.getHeader("User-Agent"), true, false);
    }

    @Transactional
    public TokenResponse completeMfa(MfaVerifyRequest request, HttpServletRequest httpRequest, MfaService mfaService) {
        String ip = clientIp(httpRequest);
        Claims claims = jwtService.parseAndValidate(request.mfaToken());
        if (!JwtService.TYPE_MFA.equals(claims.get(JwtService.CLAIM_TOKEN_TYPE, String.class))) {
            throw new DomainException(ErrorCode.TOKEN_INVALID, "Invalid MFA token", HttpStatus.UNAUTHORIZED);
        }
        UUID userId = UUID.fromString(claims.getSubject());
        rateLimitService.checkMfa(userId.toString(), ip);

        if (!mfaService.verifyCode(userId, request.code())) {
            throw new DomainException(ErrorCode.MFA_INVALID, "Invalid MFA code", HttpStatus.UNAUTHORIZED);
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> DomainException.notFound("User not found"));
        DeviceContext device = upsertDevice(userId, request.deviceFingerprint(), request.platform(),
                request.deviceName());
        return issueTokens(user, device, ip, httpRequest.getHeader("User-Agent"), true, true);
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest request, HttpServletRequest httpRequest) {
        String hash = tokenHasher.sha256(request.refreshToken());
        UserSessionEntity session = sessionRepository.findByRefreshTokenHashAndRevokedAtIsNull(hash).orElse(null);

        if (session == null) {
            sessionRepository.findByRefreshTokenHash(hash).ifPresent(revoked -> {
                sessionRepository.revokeFamily(revoked.getFamilyId(), Instant.now());
                eventPublisher.publish(new SuspiciousLoginDetectedEvent(
                        revoked.getUserId(), clientIp(httpRequest), "Refresh token reuse detected"));
            });
            throw new DomainException(ErrorCode.TOKEN_REUSE_DETECTED, "Refresh token invalid or reused",
                    HttpStatus.UNAUTHORIZED);
        }

        if (session.getExpiresAt().isBefore(Instant.now())) {
            session.setRevokedAt(Instant.now());
            sessionRepository.save(session);
            throw new DomainException(ErrorCode.TOKEN_INVALID, "Refresh token expired", HttpStatus.UNAUTHORIZED);
        }

        // Rotate: revoke old, issue new in same family
        session.setRevokedAt(Instant.now());
        sessionRepository.save(session);

        UserEntity user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> DomainException.notFound("User not found"));

        UserDeviceEntity deviceEntity = session.getDeviceId() != null
                ? deviceRepository.findById(session.getDeviceId()).orElse(null)
                : null;
        DeviceContext device = deviceEntity != null
                ? new DeviceContext(deviceEntity.getId(), false)
                : upsertDevice(user.getId(), "unknown", "UNKNOWN", null);

        return issueTokensWithFamily(user, device, clientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                session.getFamilyId(), false, true);
    }

    @Transactional
    public void logout(String refreshToken, AuthenticatedUser user) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            String hash = tokenHasher.sha256(refreshToken);
            sessionRepository.findByRefreshTokenHashAndRevokedAtIsNull(hash).ifPresent(session -> {
                if (session.getUserId().equals(user.userId())) {
                    session.setRevokedAt(Instant.now());
                    sessionRepository.save(session);
                    eventPublisher.publish(new SessionRevokedEvent(user.userId(), session.getId()));
                }
            });
        } else {
            sessionRepository.revokeByIdAndUser(user.sessionId(), user.userId(), Instant.now());
            eventPublisher.publish(new SessionRevokedEvent(user.userId(), user.sessionId()));
        }
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> listSessions(AuthenticatedUser user) {
        return sessionRepository.findByUserIdAndRevokedAtIsNullOrderByCreatedAtDesc(user.userId()).stream()
                .map(s -> new SessionResponse(
                        s.getId(),
                        s.getDeviceId(),
                        s.getIpAddress(),
                        s.getUserAgent(),
                        s.getCreatedAt(),
                        s.getExpiresAt(),
                        s.getId().equals(user.sessionId())))
                .toList();
    }

    @Transactional
    public void revokeSession(AuthenticatedUser user, UUID sessionId) {
        int updated = sessionRepository.revokeByIdAndUser(sessionId, user.userId(), Instant.now());
        if (updated == 0) {
            throw DomainException.notFound("Session not found");
        }
        eventPublisher.publish(new SessionRevokedEvent(user.userId(), sessionId));
    }

    @Transactional(readOnly = true)
    public List<DeviceResponse> listDevices(AuthenticatedUser user) {
        return deviceRepository.findByUserIdOrderByLastSeenAtDesc(user.userId()).stream()
                .map(d -> new DeviceResponse(d.getId(), d.getPlatform(), d.getDeviceName(), d.getLastSeenAt(),
                        d.isTrusted()))
                .toList();
    }

    private TokenResponse issueTokens(UserEntity user, DeviceContext device, String ip, String userAgent,
            boolean publishLogin, boolean mfaVerified) {
        return issueTokensWithFamily(user, device, ip, userAgent, UUID.randomUUID(), publishLogin, mfaVerified);
    }

    private TokenResponse issueTokensWithFamily(UserEntity user, DeviceContext device, String ip, String userAgent,
            UUID familyId, boolean publishLogin, boolean mfaVerified) {
        Set<String> roles = user.getRoles().stream().map(RoleEntity::getName).collect(Collectors.toSet());
        String refreshToken = generateOpaqueToken();
        UserSessionEntity session = new UserSessionEntity();
        session.setUserId(user.getId());
        session.setDeviceId(device.deviceId());
        session.setRefreshTokenHash(tokenHasher.sha256(refreshToken));
        session.setFamilyId(familyId);
        session.setIpAddress(ip);
        session.setUserAgent(truncate(userAgent, 512));
        session.setExpiresAt(Instant.now().plus(jwtProperties.getRefreshTokenDays(), ChronoUnit.DAYS));
        sessionRepository.save(session);

        String accessToken = jwtService.createAccessToken(user.getId(), session.getId(), user.getEmail(), roles,
                mfaVerified);
        boolean mfaEnabled = mfaSettingsRepository.findById(user.getId()).map(MfaSettingsEntity::isEnabled)
                .orElse(false);

        if (publishLogin) {
            eventPublisher.publish(new UserLoggedInEvent(user.getId(), session.getId(), ip, device.newDevice()));
        }

        return TokenResponse.of(
                accessToken,
                refreshToken,
                jwtProperties.getAccessTokenMinutes() * 60,
                user.getId(),
                roles,
                mfaEnabled);
    }

    private DeviceContext upsertDevice(UUID userId, String fingerprint, String platform, String deviceName) {
        return deviceRepository.findByUserIdAndDeviceFingerprint(userId, fingerprint)
                .map(existing -> {
                    existing.setLastSeenAt(Instant.now());
                    if (deviceName != null) {
                        existing.setDeviceName(deviceName);
                    }
                    deviceRepository.save(existing);
                    return new DeviceContext(existing.getId(), false);
                })
                .orElseGet(() -> {
                    UserDeviceEntity device = new UserDeviceEntity();
                    device.setUserId(userId);
                    device.setDeviceFingerprint(fingerprint);
                    device.setPlatform(platform);
                    device.setDeviceName(deviceName);
                    device.setTrusted(false);
                    deviceRepository.save(device);
                    return new DeviceContext(device.getId(), true);
                });
    }

    private void recordAttempt(String identifier, String ip, boolean success) {
        LoginAttemptEntity attempt = new LoginAttemptEntity();
        attempt.setIdentifier(identifier);
        attempt.setIpAddress(ip);
        attempt.setSuccess(success);
        loginAttemptRepository.save(attempt);
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    private record DeviceContext(UUID deviceId, boolean newDevice) {
    }
}
