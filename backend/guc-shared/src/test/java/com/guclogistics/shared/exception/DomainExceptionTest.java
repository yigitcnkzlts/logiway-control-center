package com.guclogistics.shared.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

class DomainExceptionTest {

    @Test
    void factoryMethodsSetExpectedCodesAndStatus() {
        assertThat(DomainException.notFound("x").getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND);
        assertThat(DomainException.notFound("x").getStatus()).isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(DomainException.conflict("x").getErrorCode()).isEqualTo(ErrorCode.CONFLICT);
        assertThat(DomainException.conflict("x").getStatus()).isEqualTo(HttpStatus.CONFLICT);

        assertThat(DomainException.forbidden("x").getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN);
        assertThat(DomainException.unauthorized("x").getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED);
        assertThat(DomainException.business("x").getErrorCode()).isEqualTo(ErrorCode.BUSINESS_RULE_VIOLATION);
        assertThat(DomainException.rateLimited("x").getErrorCode()).isEqualTo(ErrorCode.RATE_LIMITED);
        assertThat(DomainException.rateLimited("x").getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void constructorPreservesMessage() {
        DomainException ex = new DomainException(ErrorCode.TOKEN_INVALID, "bad token", HttpStatus.UNAUTHORIZED);
        assertThat(ex.getMessage()).isEqualTo("bad token");
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.TOKEN_INVALID);
    }
}
