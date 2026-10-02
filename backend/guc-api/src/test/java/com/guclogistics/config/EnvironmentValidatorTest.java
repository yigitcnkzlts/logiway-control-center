package com.guclogistics.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EnvironmentValidatorTest {

    private static final String VALID_JWT = "test-secret-must-be-at-least-32-bytes-long!!";
    private static final String VALID_ENCRYPTION_KEY = Base64.getEncoder().encodeToString(new byte[32]);

    private Environment environment;
    private EnvironmentValidator validator;

    @BeforeEach
    void setUp() {
        environment = mock(Environment.class);
        validator = new EnvironmentValidator(environment);
        setValidConfig();
    }

    @Test
    void missingJwtSecretFails() {
        ReflectionTestUtils.setField(validator, "jwtSecret", "");

        assertThatThrownBy(validator::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void weakSecretInProdFails() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        ReflectionTestUtils.setField(validator, "jwtSecret", "change-me-in-production");

        assertThatThrownBy(validator::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("weak/default");
    }

    @Test
    void validConfigPasses() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"test"});

        assertThatCode(validator::validate).doesNotThrowAnyException();
    }

    private void setValidConfig() {
        ReflectionTestUtils.setField(validator, "jwtSecret", VALID_JWT);
        ReflectionTestUtils.setField(validator, "encryptionKey", VALID_ENCRYPTION_KEY);
        ReflectionTestUtils.setField(validator, "datasourceUrl", "jdbc:postgresql://localhost/guc");
        ReflectionTestUtils.setField(validator, "datasourceUsername", "guc");
        ReflectionTestUtils.setField(validator, "datasourcePassword", "strong-password-123");
        ReflectionTestUtils.setField(validator, "redisHost", "localhost");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"test"});
    }
}
