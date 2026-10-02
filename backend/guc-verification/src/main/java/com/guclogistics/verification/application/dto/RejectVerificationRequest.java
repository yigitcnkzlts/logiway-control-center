package com.guclogistics.verification.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectVerificationRequest(
        @NotBlank @Size(max = 1000) String reason
) {
}
