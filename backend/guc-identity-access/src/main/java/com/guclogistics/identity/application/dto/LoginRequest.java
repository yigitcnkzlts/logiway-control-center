package com.guclogistics.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(max = 128) String password,
        @NotBlank @Size(max = 128) String deviceFingerprint,
        @NotBlank @Size(max = 32) String platform,
        @Size(max = 120) String deviceName
) {
}
