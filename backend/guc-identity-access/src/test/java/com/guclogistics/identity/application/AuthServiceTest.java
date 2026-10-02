package com.guclogistics.identity.application;

import com.guclogistics.identity.application.dto.LoginRequest;
import com.guclogistics.identity.application.dto.RefreshRequest;
import com.guclogistics.identity.application.dto.RegisterRequest;
import com.guclogistics.identity.domain.UserStatus;
import com.guclogistics.identity.domain.event.SessionRevokedEvent;
import com.guclogistics.identity.domain.event.SuspiciousLoginDetectedEvent;
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
import com.guclogistics.shared.security.AuthenticatedUser;
import com.guclogistics.shared.events.identity.UserCompanyRegistrationRequestedEvent;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserJpaRepository userRepository;
    @Mock
    private RoleJpaRepository roleRepository;
    @Mock
    private UserSessionJpaRepository sessionRepository;
    @Mock
    private UserDeviceJpaRepository deviceRepository;
    @Mock
    private MfaSettingsJpaRepository mfaSettingsRepository;
    @Mock
    private LoginAttemptJpaRepository loginAttemptRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private JwtProperties jwtProperties;
    @Mock
    private TokenHasher tokenHasher;
    @Mock
    private RateLimitService rateLimitService;
    @Mock
    private FeatureFlagService featureFlagService;
    @Mock
    private DomainEventPublisher eventPublisher;
    @Mock
    private HttpServletRequest httpRequest;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private RoleEntity shipperRole;

    @BeforeEach
    void setUp() {
        shipperRole = new RoleEntity();
        shipperRole.setId(UUID.randomUUID());
        shipperRole.setName("SHIPPER");

        lenient().when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        lenient().when(httpRequest.getHeader("User-Agent")).thenReturn("JUnit");
        lenient().when(jwtProperties.getAccessTokenMinutes()).thenReturn(15L);
        lenient().when(jwtProperties.getRefreshTokenDays()).thenReturn(7L);
        lenient().when(tokenHasher.sha256(any())).thenAnswer(inv -> "hash-" + inv.getArgument(0));
        lenient().when(mfaSettingsRepository.findById(any())).thenReturn(Optional.empty());
        lenient().when(featureFlagService.isEnabled("mfa.required")).thenReturn(false);
        lenient().when(passwordEncoder.encode(any())).thenAnswer(inv -> "encoded-" + inv.getArgument(0));
    }

    @Test
    void registerSuccess() {
        RegisterRequest request = new RegisterRequest(
                "NewUser@Example.com", "SecurePass123!", null, "SHIPPER",
                "Modern Karton", "TR", "fp-1", "WEB", "Chrome", null, null);

        when(userRepository.existsByEmailIgnoreCase("NewUser@Example.com")).thenReturn(false);
        when(roleRepository.findByName("SHIPPER")).thenReturn(Optional.of(shipperRole));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(deviceRepository.findByUserIdAndDeviceFingerprint(any(), eq("fp-1"))).thenReturn(Optional.empty());
        when(deviceRepository.save(any())).thenAnswer(inv -> {
            UserDeviceEntity d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });
        when(sessionRepository.save(any())).thenAnswer(inv -> {
            UserSessionEntity s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(jwtService.createAccessToken(any(), any(), any(), any(), eq(false)))
                .thenReturn("access-token");

        var response = authService.register(request, httpRequest);

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isNotBlank();
        verify(eventPublisher).publish(any(UserRegisteredEvent.class));
        verify(eventPublisher).publish(any(UserCompanyRegistrationRequestedEvent.class));
        verify(rateLimitService).checkRegister("127.0.0.1");
    }

    @Test
    void companyRegistrationRequiresCompanyIdentity() {
        RegisterRequest request = new RegisterRequest(
                "missing-company@example.com", "SecurePass123!", null, "SHIPPER",
                null, null, "fp-1", "WEB", null, null, null);
        when(userRepository.existsByEmailIgnoreCase(request.email())).thenReturn(false);
        when(roleRepository.findByName("SHIPPER")).thenReturn(Optional.of(shipperRole));

        assertThatThrownBy(() -> authService.register(request, httpRequest))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("Company name and country");
    }

    @Test
    void registerDuplicateEmailConflict() {
        RegisterRequest request = new RegisterRequest(
                "dup@example.com", "SecurePass123!", null, "SHIPPER",
                "Modern Karton", "TR", "fp-1", "WEB", null, null, null);

        when(userRepository.existsByEmailIgnoreCase("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request, httpRequest))
                .isInstanceOf(DomainException.class)
                .satisfies(ex -> assertThat(((DomainException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void loginInvalidCredentialsWhenUserNotFound() {
        LoginRequest request = new LoginRequest("missing@example.com", "SecurePass123!", "fp", "WEB", null);
        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(DomainException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    }

    @Test
    void loginLockoutAfterFailedAttempts() {
        UUID userId = UUID.randomUUID();
        UserEntity user = buildUser(userId, "lock@example.com", "SecurePass123!");
        LoginRequest badLogin = new LoginRequest("lock@example.com", "WrongPassword1!", "fp", "WEB", null);
        LoginRequest goodLogin = new LoginRequest("lock@example.com", "SecurePass123!", "fp", "WEB", null);

        when(userRepository.findByEmailIgnoreCase("lock@example.com")).thenReturn(Optional.of(user));
        lenient().when(passwordEncoder.matches(eq("SecurePass123!"), any())).thenReturn(true);
        when(passwordEncoder.matches(eq("WrongPassword1!"), any())).thenReturn(false);
        when(loginAttemptRepository.countFailedSince(eq("lock@example.com"), any(Instant.class))).thenReturn(5L);

        assertThatThrownBy(() -> authService.login(badLogin, httpRequest))
                .isInstanceOf(DomainException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_CREDENTIALS);

        assertThat(user.getLockedUntil()).isAfter(Instant.now());
        verify(userRepository).save(user);
        verify(eventPublisher).publish(any(SuspiciousLoginDetectedEvent.class));

        assertThatThrownBy(() -> authService.login(goodLogin, httpRequest))
                .isInstanceOf(DomainException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ACCOUNT_LOCKED);
    }

    @Test
    void refreshRotatesActiveSession() {
        UUID userId = UUID.randomUUID();
        UUID familyId = UUID.randomUUID();
        String refreshToken = "refresh-token-abc";
        UserSessionEntity session = activeSession(userId, familyId, refreshToken);
        UserEntity user = buildUser(userId, "user@example.com", "SecurePass123!");

        when(sessionRepository.findByRefreshTokenHashAndRevokedAtIsNull("hash-" + refreshToken))
                .thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(deviceRepository.findByUserIdAndDeviceFingerprint(any(), any())).thenReturn(Optional.empty());
        when(deviceRepository.save(any())).thenAnswer(inv -> {
            UserDeviceEntity d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.createAccessToken(any(), any(), any(), any(), eq(true)))
                .thenReturn("new-access");

        var response = authService.refresh(new RefreshRequest(refreshToken), httpRequest);

        assertThat(response.accessToken()).isEqualTo("new-access");
        assertThat(response.refreshToken()).isNotEqualTo(refreshToken);
        assertThat(session.getRevokedAt()).isNotNull();
    }

    @Test
    void refreshReusedTokenTriggersReuseDetection() {
        String refreshToken = "old-refresh";
        UUID userId = UUID.randomUUID();
        UserSessionEntity revoked = activeSession(userId, UUID.randomUUID(), refreshToken);
        revoked.setRevokedAt(Instant.now().minus(1, ChronoUnit.HOURS));

        when(sessionRepository.findByRefreshTokenHashAndRevokedAtIsNull("hash-" + refreshToken))
                .thenReturn(Optional.empty());
        when(sessionRepository.findByRefreshTokenHash("hash-" + refreshToken))
                .thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> authService.refresh(new RefreshRequest(refreshToken), httpRequest))
                .isInstanceOf(DomainException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOKEN_REUSE_DETECTED);

        verify(sessionRepository).revokeFamily(eq(revoked.getFamilyId()), any(Instant.class));
        verify(eventPublisher).publish(any(SuspiciousLoginDetectedEvent.class));
    }

    @Test
    void logoutRevokesSession() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        String refreshToken = "logout-token";
        UserSessionEntity session = activeSession(userId, UUID.randomUUID(), refreshToken);
        session.setId(sessionId);

        AuthenticatedUser user = new AuthenticatedUser(userId, sessionId, "u@example.com", Set.of("SHIPPER"), true);

        when(sessionRepository.findByRefreshTokenHashAndRevokedAtIsNull("hash-" + refreshToken))
                .thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.logout(refreshToken, user);

        assertThat(session.getRevokedAt()).isNotNull();
        verify(eventPublisher).publish(any(SessionRevokedEvent.class));
    }

    @Test
    void loginSuccessIssuesTokens() {
        UUID userId = UUID.randomUUID();
        UserEntity user = buildUser(userId, "ok@example.com", "SecurePass123!");
        LoginRequest request = new LoginRequest("ok@example.com", "SecurePass123!", "fp-9", "ANDROID", "Pixel");
        when(userRepository.findByEmailIgnoreCase("ok@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("SecurePass123!", user.getPasswordHash())).thenReturn(true);
        when(deviceRepository.findByUserIdAndDeviceFingerprint(userId, "fp-9")).thenReturn(Optional.empty());
        when(deviceRepository.save(any())).thenAnswer(inv -> {
            UserDeviceEntity d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });
        when(sessionRepository.save(any())).thenAnswer(inv -> {
            UserSessionEntity s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(jwtService.createAccessToken(any(), any(), any(), any(), eq(false))).thenReturn("access");

        var response = authService.login(request, httpRequest);
        assertThat(response.accessToken()).isEqualTo("access");
        assertThat(response.mfaRequired()).isFalse();
    }

    @Test
    void loginReturnsMfaChallengeWhenEnabled() {
        UUID userId = UUID.randomUUID();
        UserEntity user = buildUser(userId, "mfa@example.com", "SecurePass123!");
        MfaSettingsEntity mfa = new MfaSettingsEntity();
        mfa.setUserId(userId);
        mfa.setEnabled(true);
        LoginRequest request = new LoginRequest("mfa@example.com", "SecurePass123!", "fp", "WEB", null);
        when(userRepository.findByEmailIgnoreCase("mfa@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(mfaSettingsRepository.findById(userId)).thenReturn(Optional.of(mfa));
        when(jwtService.createMfaChallengeToken(userId, "mfa@example.com")).thenReturn("mfa-token");

        var response = authService.login(request, httpRequest);
        assertThat(response.mfaRequired()).isTrue();
        assertThat(response.accessToken()).isEqualTo("mfa-token");
    }

    @Test
    void listSessionsAndDevicesAndRevoke() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        AuthenticatedUser principal = new AuthenticatedUser(userId, sessionId, "u@example.com", Set.of("SHIPPER"),
                true);
        UserSessionEntity session = activeSession(userId, UUID.randomUUID(), "r1");
        session.setId(sessionId);
        when(sessionRepository.findByUserIdAndRevokedAtIsNullOrderByCreatedAtDesc(userId))
                .thenReturn(java.util.List.of(session));
        UserDeviceEntity device = new UserDeviceEntity();
        device.setId(UUID.randomUUID());
        device.setPlatform("WEB");
        device.setLastSeenAt(Instant.now());
        when(deviceRepository.findByUserIdOrderByLastSeenAtDesc(userId)).thenReturn(java.util.List.of(device));
        when(sessionRepository.revokeByIdAndUser(eq(sessionId), eq(userId), any())).thenReturn(1);

        assertThat(authService.listSessions(principal)).hasSize(1);
        assertThat(authService.listDevices(principal)).hasSize(1);
        authService.revokeSession(principal, sessionId);
        verify(eventPublisher).publish(any(SessionRevokedEvent.class));
    }

    @Test
    void revokeUnknownSessionThrowsNotFound() {
        AuthenticatedUser principal = new AuthenticatedUser(UUID.randomUUID(), UUID.randomUUID(), "u@example.com",
                Set.of("SHIPPER"), true);
        when(sessionRepository.revokeByIdAndUser(any(), any(), any())).thenReturn(0);
        assertThatThrownBy(() -> authService.revokeSession(principal, UUID.randomUUID()))
                .isInstanceOf(DomainException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    private UserEntity buildUser(UUID userId, String email, String rawPassword) {
        UserEntity user = new UserEntity();
        user.setId(userId);
        user.setEmail(email);
        user.setPasswordHash("encoded-" + rawPassword);
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().add(shipperRole);
        return user;
    }

    private UserSessionEntity activeSession(UUID userId, UUID familyId, String refreshToken) {
        UserSessionEntity session = new UserSessionEntity();
        session.setId(UUID.randomUUID());
        session.setUserId(userId);
        session.setFamilyId(familyId);
        session.setRefreshTokenHash("hash-" + refreshToken);
        session.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        return session;
    }
}
