package com.guclogistics.identity.infrastructure.ratelimit;

import com.guclogistics.shared.exception.DomainException;
import com.guclogistics.shared.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RateLimitServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        rateLimitService = new RateLimitService(redisTemplate);
    }

    @Test
    void checkRegisterAllowsRequestsWithinLimit() {
        when(valueOperations.increment(anyString())).thenReturn(1L, 2L, 3L, 4L, 5L);

        assertThatCode(() -> {
            for (int i = 0; i < 5; i++) {
                rateLimitService.checkRegister("192.168.1.1");
            }
        }).doesNotThrowAnyException();
    }

    @Test
    void checkRegisterExceedingLimitThrowsRateLimited() {
        when(valueOperations.increment(anyString())).thenReturn(6L);

        assertThatThrownBy(() -> rateLimitService.checkRegister("192.168.1.1"))
                .isInstanceOf(DomainException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RATE_LIMITED);
    }

    @Test
    void checkLoginSetsExpiryOnFirstRequest() {
        when(valueOperations.increment(anyString())).thenReturn(1L);

        rateLimitService.checkLogin("user@example.com", "10.0.0.1");

        verify(redisTemplate, times(2)).expire(anyString(), eq(Duration.ofMinutes(15)));
    }

    @Test
    void checkMfaExceedingUserLimitThrowsRateLimited() {
        java.util.Map<String, Long> counts = new java.util.HashMap<>();
        when(valueOperations.increment(anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return counts.merge(key, 1L, Long::sum);
        });

        for (int i = 0; i < 10; i++) {
            rateLimitService.checkMfa("user-1", "10.0.0.1");
        }

        assertThatThrownBy(() -> rateLimitService.checkMfa("user-1", "10.0.0.1"))
                .isInstanceOf(DomainException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RATE_LIMITED);
    }
}
