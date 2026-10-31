package com.guclogistics.identity.infrastructure.ratelimit;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@Component
@ConfigurationProperties(prefix = "guc.security.rate-limit")
public class RateLimitProperties {

    @Min(1)
    private int registerPerHour = 5;
}
