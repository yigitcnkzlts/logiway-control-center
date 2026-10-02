package com.guclogistics.identity.infrastructure.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "guc.security.jwt")
public class JwtProperties {

    private String issuer = "guclogistics";
    private String audience = "guclogistics-api";
    private String secret;
    private long accessTokenMinutes = 15;
    private long refreshTokenDays = 7;
    private long mfaTokenMinutes = 5;
}
