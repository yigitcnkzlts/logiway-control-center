package com.guclogistics.shared.web;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class SecurityHeadersFilterTest {

    @Test
    void setsSecurityHeaders() throws Exception {
        SecurityHeadersFilter filter = new SecurityHeadersFilter(false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/health");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getHeader("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(response.getHeader("X-Frame-Options")).isEqualTo("DENY");
        assertThat(response.getHeader("Referrer-Policy")).isEqualTo("no-referrer");
        assertThat(response.getHeader("Content-Security-Policy")).contains("default-src 'none'");
        assertThat(response.getHeader("Permissions-Policy")).contains("geolocation=()");
        assertThat(response.getHeader("X-XSS-Protection")).isEqualTo("0");
        assertThat(response.getHeader("Strict-Transport-Security")).isNull();
        verify(chain).doFilter(request, response);
    }

    @Test
    void setsHstsWhenEnabled() throws Exception {
        SecurityHeadersFilter filter = new SecurityHeadersFilter(true);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(new MockHttpServletRequest(), response, chain);

        assertThat(response.getHeader("Strict-Transport-Security"))
                .contains("max-age=31536000")
                .contains("includeSubDomains");
    }
}
