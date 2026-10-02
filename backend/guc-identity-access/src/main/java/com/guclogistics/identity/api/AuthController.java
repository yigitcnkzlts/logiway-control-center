package com.guclogistics.identity.api;

import com.guclogistics.identity.application.AuthService;
import com.guclogistics.identity.application.MfaService;
import com.guclogistics.identity.application.dto.*;
import com.guclogistics.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Identity & Access")
public class AuthController {

    private final AuthService authService;
    private final MfaService mfaService;

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new user")
    public TokenResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        return authService.register(request, httpRequest);
    }

    @PostMapping("/auth/login")
    @Operation(summary = "Login with email and password")
    public TokenResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return authService.login(request, httpRequest);
    }

    @PostMapping("/auth/refresh")
    @Operation(summary = "Rotate refresh token and issue new access token")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request, HttpServletRequest httpRequest) {
        return authService.refresh(request, httpRequest);
    }

    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Logout current or provided refresh session")
    public void logout(@RequestBody(required = false) RefreshRequest request,
                       @AuthenticationPrincipal AuthenticatedUser user) {
        authService.logout(request != null ? request.refreshToken() : null, user);
    }

    @PostMapping("/auth/mfa/enroll")
    @Operation(summary = "Begin TOTP MFA enrollment")
    public MfaEnrollResponse enrollMfa(@AuthenticationPrincipal AuthenticatedUser user) {
        return mfaService.enroll(user);
    }

    @PostMapping("/auth/mfa/enable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Confirm MFA enrollment with TOTP code")
    public void enableMfa(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Map<String, String> body) {
        mfaService.enable(user, body.get("code"));
    }

    @PostMapping("/auth/mfa/disable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Disable MFA")
    public void disableMfa(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody Map<String, String> body) {
        mfaService.disable(user, body.get("code"));
    }

    @PostMapping("/auth/mfa/verify")
    @Operation(summary = "Complete login after MFA challenge")
    public TokenResponse verifyMfa(@Valid @RequestBody MfaVerifyRequest request, HttpServletRequest httpRequest) {
        return authService.completeMfa(request, httpRequest, mfaService);
    }

    @GetMapping("/sessions")
    @Operation(summary = "List active sessions")
    public List<SessionResponse> sessions(@AuthenticationPrincipal AuthenticatedUser user) {
        return authService.listSessions(user);
    }

    @DeleteMapping("/sessions/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Revoke a session")
    public void revokeSession(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID sessionId) {
        authService.revokeSession(user, sessionId);
    }

    @GetMapping("/devices")
    @Operation(summary = "List known devices")
    public List<DeviceResponse> devices(@AuthenticationPrincipal AuthenticatedUser user) {
        return authService.listDevices(user);
    }

    @GetMapping("/me")
    @Operation(summary = "Current authenticated principal")
    public AuthenticatedUser me(@AuthenticationPrincipal AuthenticatedUser user) {
        return user;
    }
}
