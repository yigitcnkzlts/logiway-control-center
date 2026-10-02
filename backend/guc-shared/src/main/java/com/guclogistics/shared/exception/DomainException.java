package com.guclogistics.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class DomainException extends RuntimeException {

    private final ErrorCode errorCode;
    private final HttpStatus status;

    public DomainException(ErrorCode errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }

    public static DomainException notFound(String message) {
        return new DomainException(ErrorCode.NOT_FOUND, message, HttpStatus.NOT_FOUND);
    }

    public static DomainException conflict(String message) {
        return new DomainException(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);
    }

    public static DomainException forbidden(String message) {
        return new DomainException(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
    }

    public static DomainException unauthorized(String message) {
        return new DomainException(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
    }

    public static DomainException business(String message) {
        return new DomainException(ErrorCode.BUSINESS_RULE_VIOLATION, message, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    public static DomainException rateLimited(String message) {
        return new DomainException(ErrorCode.RATE_LIMITED, message, HttpStatus.TOO_MANY_REQUESTS);
    }
}
