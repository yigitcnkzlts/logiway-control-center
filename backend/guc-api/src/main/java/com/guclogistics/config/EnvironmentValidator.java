package com.guclogistics.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Fail-fast validation for required runtime secrets and configuration.
 * Production profile rejects missing/weak secrets before the app accepts traffic.
 */
@Component
public class EnvironmentValidator {

    private final Environment environment;

    @Value("${guc.security.jwt.secret:}")
    private String jwtSecret;

    @Value("${guc.security.encryption-key:}")
    private String encryptionKey;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Value("${spring.data.redis.host:}")
    private String redisHost;

    public EnvironmentValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validate() {
        List<String> errors = new ArrayList<>();
        boolean prod = List.of(environment.getActiveProfiles()).contains("prod")
                || (environment.getActiveProfiles().length == 0
                && "prod".equals(environment.getProperty("spring.profiles.default")));

        require(errors, "DB_URL / spring.datasource.url", datasourceUrl);
        require(errors, "DB_USER / spring.datasource.username", datasourceUsername);
        require(errors, "DB_PASSWORD / spring.datasource.password", datasourcePassword);
        require(errors, "REDIS_HOST / spring.data.redis.host", redisHost);
        require(errors, "JWT_SECRET / guc.security.jwt.secret", jwtSecret);
        require(errors, "ENCRYPTION_KEY / guc.security.encryption-key", encryptionKey);

        if (jwtSecret != null && jwtSecret.getBytes().length < 32) {
            errors.add("JWT_SECRET must be at least 32 bytes");
        }
        if (encryptionKey != null && !encryptionKey.isBlank()) {
            try {
                byte[] decoded = Base64.getDecoder().decode(encryptionKey);
                if (decoded.length != 32) {
                    errors.add("ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256)");
                }
            } catch (IllegalArgumentException ex) {
                errors.add("ENCRYPTION_KEY must be valid Base64");
            }
        }

        if (prod) {
            if (containsWeak(jwtSecret)) {
                errors.add("JWT_SECRET appears to be a weak/default value (prod)");
            }
            if (containsWeak(datasourcePassword)) {
                errors.add("DB_PASSWORD appears to be a weak/default value (prod)");
            }
        }

        if (!errors.isEmpty()) {
            throw new IllegalStateException("Configuration validation failed: " + String.join("; ", errors));
        }
    }

    private static void require(List<String> errors, String name, String value) {
        if (value == null || value.isBlank()) {
            errors.add(name + " is required");
        }
    }

    private static boolean containsWeak(String value) {
        if (value == null) {
            return true;
        }
        String lower = value.toLowerCase();
        return lower.contains("change-me")
                || lower.contains("dev-only")
                || lower.contains("replace-with")
                || lower.equals("guc_secret_change_me")
                || lower.equals("password")
                || lower.equals("secret");
    }
}
