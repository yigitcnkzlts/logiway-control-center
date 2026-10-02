package com.guclogistics.identity.infrastructure.security;

import com.guclogistics.shared.security.AuthenticatedUser;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    JwtService jwtService;
    @Mock
    FilterChain filterChain;
    @Mock
    Claims claims;
    @InjectMocks
    JwtAuthenticationFilter filter;

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void setsAuthenticationForValidAccessToken() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        when(jwtService.parseAndValidate("token")).thenReturn(claims);
        when(claims.get(JwtService.CLAIM_TOKEN_TYPE, String.class)).thenReturn(JwtService.TYPE_ACCESS);
        when(claims.getSubject()).thenReturn(userId.toString());
        when(claims.get(JwtService.CLAIM_SESSION, String.class)).thenReturn(sessionId.toString());
        when(claims.get(JwtService.CLAIM_MFA, Boolean.class)).thenReturn(true);
        when(claims.get("email", String.class)).thenReturn("a@b.com");
        when(jwtService.extractRoles(claims)).thenReturn(Set.of("SHIPPER"));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                .isInstanceOf(AuthenticatedUser.class);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void clearsContextOnInvalidTokenAndContinues() throws Exception {
        when(jwtService.parseAndValidate(anyString())).thenThrow(new RuntimeException("bad"));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer bad");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void ignoresMissingAuthorizationHeader() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, filterChain);
        verify(jwtService, never()).parseAndValidate(anyString());
        verify(filterChain).doFilter(request, response);
    }
}
