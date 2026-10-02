package com.guclogistics.identity.infrastructure.security;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class TotpServiceTest {

    private final TotpService totpService = new TotpService();

    @Test
    void generatesSecretAndValidatesCurrentCodeWindow() {
        String secret = totpService.generateSecret();
        assertThat(secret).isNotBlank();

        String uri = totpService.otpAuthUri("GucLogistics", "user@example.com", secret);
        assertThat(uri).startsWith("otpauth://totp/GucLogistics:user@example.com");
        assertThat(uri).contains("secret=");
    }

    @Test
    void verifyAcceptsGeneratedCodeInWindow() throws Exception {
        String secret = totpService.generateSecret();
        String currentCode = generateCurrentCode(secret);

        assertThat(totpService.verify(secret, currentCode)).isTrue();
    }

    @Test
    void verifyRejectsBadCode() {
        String secret = totpService.generateSecret();

        assertThat(totpService.verify(secret, "000000")).isFalse();
        assertThat(totpService.verify(secret, "abc123")).isFalse();
        assertThat(totpService.verify(secret, null)).isFalse();
        assertThat(totpService.verify(secret, "12345")).isFalse();
    }

    private String generateCurrentCode(String secretBase64) throws Exception {
        long currentStep = Instant.now().getEpochSecond() / 30;
        Method method = TotpService.class.getDeclaredMethod("generateCode", String.class, long.class);
        method.setAccessible(true);
        return (String) method.invoke(totpService, secretBase64, currentStep);
    }
}
