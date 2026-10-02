package com.guclogistics.shared.exception;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ErrorCodeTest {

    @Test
    void containsSecurityAndBusinessCodes() {
        assertThat(ErrorCode.values()).contains(
                ErrorCode.UNAUTHORIZED,
                ErrorCode.FORBIDDEN,
                ErrorCode.RATE_LIMITED,
                ErrorCode.TOKEN_REUSE_DETECTED,
                ErrorCode.ACCOUNT_LOCKED
        );
    }
}
