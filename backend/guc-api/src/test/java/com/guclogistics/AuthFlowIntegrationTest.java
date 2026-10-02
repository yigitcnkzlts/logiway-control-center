package com.guclogistics;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Full auth E2E against Postgres + Redis.
 * Enable with: {@code mvn verify -Dguc.integration=true} (requires healthy Docker).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@EnabledIfSystemProperty(named = "guc.integration", matches = "true")
class AuthFlowIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
            .withDatabaseName("guclogistics")
            .withUsername("guc")
            .withPassword("guc");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("guc.security.jwt.secret", () -> "test-secret-must-be-at-least-32-bytes-long!!");
        registry.add("guc.security.encryption-key", () -> "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        // Explicit env-style aliases documented for operators
        registry.add("DB_URL", postgres::getJdbcUrl);
        registry.add("DB_USER", postgres::getUsername);
        registry.add("DB_PASSWORD", postgres::getPassword);
        registry.add("REDIS_HOST", redis::getHost);
        registry.add("REDIS_PORT", () -> String.valueOf(redis.getMappedPort(6379)));
        registry.add("JWT_SECRET", () -> "test-secret-must-be-at-least-32-bytes-long!!");
        registry.add("ENCRYPTION_KEY", () -> "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
    }

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void registerLoginRefreshRotationAndReuseDetection() throws Exception {
        String email = "shipper+" + System.nanoTime() + "@example.com";
        String registerBody = """
                {
                  "email": "%s",
                  "password": "SecurePass123!",
                  "role": "SHIPPER",
                  "deviceFingerprint": "device-1",
                  "platform": "ANDROID",
                  "deviceName": "Pixel"
                }
                """.formatted(email);

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        JsonNode registerJson = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        String accessToken = registerJson.get("accessToken").asText();
        String refreshToken = registerJson.get("refreshToken").asText();

        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        mockMvc.perform(get("/api/v1/users/admin/ping").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        String newRefresh = objectMapper.readTree(refreshResult.getResponse().getContentAsString())
                .get("refreshToken").asText();
        assertThat(newRefresh).isNotEqualTo(refreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginLockoutAfterRepeatedFailures() throws Exception {
        String email = "driver+" + System.nanoTime() + "@example.com";
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "SecurePass123!",
                                  "role": "INDEPENDENT_DRIVER",
                                  "deviceFingerprint": "device-2",
                                  "platform": "IOS"
                                }
                                """.formatted(email)))
                .andExpect(status().isCreated());

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "email": "%s",
                                      "password": "WrongPassword1!",
                                      "deviceFingerprint": "device-2",
                                      "platform": "IOS"
                                    }
                                    """.formatted(email)))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "SecurePass123!",
                                  "deviceFingerprint": "device-2",
                                  "platform": "IOS"
                                }
                                """.formatted(email)))
                .andExpect(status().isLocked());
    }

    @Test
    void registerRateLimitEventuallyReturns429() throws Exception {
        String ip = "203.0.113." + (System.nanoTime() % 250);
        String registerTemplate = """
                {
                  "email": "ratelimit+%d@example.com",
                  "password": "SecurePass123!",
                  "role": "SHIPPER",
                  "deviceFingerprint": "rl-device",
                  "platform": "WEB"
                }
                """;

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("X-Forwarded-For", ip)
                            .content(registerTemplate.formatted(System.nanoTime() + i)))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Forwarded-For", ip)
                        .content(registerTemplate.formatted(System.nanoTime())))
                .andExpect(status().isTooManyRequests());
    }
}
