package com.guclogistics.identity.api;

import com.guclogistics.identity.application.AuthService;
import com.guclogistics.identity.application.MfaService;
import com.guclogistics.identity.application.dto.TokenResponse;
import com.guclogistics.shared.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    AuthService authService;
    @Mock
    MfaService mfaService;
    @InjectMocks
    AuthController controller;

    @Test
    void meReturnsPrincipal() {
        AuthenticatedUser user = new AuthenticatedUser(UUID.randomUUID(), UUID.randomUUID(), "a@b.com", Set.of("SHIPPER"), true);
        assertThat(controller.me(user)).isSameAs(user);
    }

    @Test
    void sessionsDelegates() {
        AuthenticatedUser user = new AuthenticatedUser(UUID.randomUUID(), UUID.randomUUID(), "a@b.com", Set.of("SHIPPER"), true);
        when(authService.listSessions(user)).thenReturn(List.of());
        assertThat(controller.sessions(user)).isEmpty();
    }

    @Test
    void enableMfaDelegates() {
        AuthenticatedUser user = new AuthenticatedUser(UUID.randomUUID(), UUID.randomUUID(), "a@b.com", Set.of("SHIPPER"), true);
        controller.enableMfa(user, Map.of("code", "123456"));
        verify(mfaService).enable(user, "123456");
    }

    @Test
    void devicesDelegates() {
        AuthenticatedUser user = new AuthenticatedUser(UUID.randomUUID(), UUID.randomUUID(), "a@b.com", Set.of("SHIPPER"), true);
        when(authService.listDevices(user)).thenReturn(List.of());
        assertThat(controller.devices(user)).isEmpty();
    }
}
