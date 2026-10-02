package com.guclogistics.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/test");
    }

    @Test
    void handleDomainException() {
        DomainException ex = new DomainException(ErrorCode.NOT_FOUND, "Resource missing", HttpStatus.NOT_FOUND);

        ProblemDetail problem = handler.handleDomain(ex, request);

        assertThat(problem.getStatus()).isEqualTo(404);
        assertThat(problem.getTitle()).isEqualTo("NOT_FOUND");
        assertThat(problem.getDetail()).isEqualTo("Resource missing");
        assertThat(problem.getProperties().get("errorCode")).isEqualTo("NOT_FOUND");
        assertThat(problem.getProperties().get("path")).isEqualTo("/api/v1/test");
    }

    @Test
    void handleValidationException() throws NoSuchMethodException {
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new Object(), "target");
        binding.addError(new FieldError("target", "email", "must be valid"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, binding);

        ProblemDetail problem = handler.handleValidation(ex, request);

        assertThat(problem.getStatus()).isEqualTo(400);
        assertThat(problem.getTitle()).isEqualTo("VALIDATION_FAILED");
        @SuppressWarnings("unchecked")
        var fields = (java.util.Map<String, String>) problem.getProperties().get("fields");
        assertThat(fields).containsEntry("email", "must be valid");
    }

    @Test
    void handleAccessDenied() {
        ProblemDetail problem = handler.handleAccessDenied(new AccessDeniedException("denied"), request);

        assertThat(problem.getStatus()).isEqualTo(403);
        assertThat(problem.getTitle()).isEqualTo("FORBIDDEN");
    }

    @Test
    void handleGenericException() {
        ProblemDetail problem = handler.handleGeneric(new RuntimeException("boom"), request);

        assertThat(problem.getStatus()).isEqualTo(500);
        assertThat(problem.getTitle()).isEqualTo("INTERNAL_ERROR");
        assertThat(problem.getDetail()).isEqualTo("Internal server error");
    }
}
