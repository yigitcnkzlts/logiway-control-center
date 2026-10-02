package com.guclogistics.identity.infrastructure.ratelimit;

import com.guclogistics.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimitService {

    private static final int LOGIN_LIMIT = 10;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);
    private static final int REGISTER_LIMIT = 5;
    private static final Duration REGISTER_WINDOW = Duration.ofHours(1);

    private final StringRedisTemplate redisTemplate;

    public void checkLogin(String identifier, String ip) {
        consume("rl:login:id:" + identifier.toLowerCase(), LOGIN_LIMIT, LOGIN_WINDOW);
        consume("rl:login:ip:" + ip, LOGIN_LIMIT * 3, LOGIN_WINDOW);
    }

    public void checkRegister(String ip) {
        consume("rl:register:ip:" + ip, REGISTER_LIMIT, REGISTER_WINDOW);
    }

    public void checkMfa(String userId, String ip) {
        consume("rl:mfa:user:" + userId, 10, Duration.ofMinutes(10));
        consume("rl:mfa:ip:" + ip, 30, Duration.ofMinutes(10));
    }

    private void consume(String key, int limit, Duration window) {
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, window);
        }
        if (count != null && count > limit) {
            throw DomainException.rateLimited("Too many requests. Please try again later.");
        }
    }
}
