package com.guclogistics.identity.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MfaVerifyRequest(
        @NotBlank String mfaToken,
        @NotBlank @Size(min = 6, max = 12) String code,
        @NotBlank @Size(max = 128) String deviceFingerprint,
        @NotBlank @Size(max = 32) String platform,
        @Size(max = 120) String deviceName
) {
}
