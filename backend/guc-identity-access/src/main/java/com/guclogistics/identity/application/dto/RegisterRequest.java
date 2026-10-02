package com.guclogistics.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
                @NotBlank @Email @Size(max = 320) String email,
                @NotBlank @Size(min = 12, max = 128) @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$", message = "Password must include upper, lower, digit and special character") String password,
                @Size(max = 32) String phone,
                @NotBlank @Pattern(regexp = "SHIPPER|LOGISTICS_COMPANY|INDEPENDENT_DRIVER|FLEET_OWNER", message = "Invalid registration role") String role,
                @Size(min = 2, max = 255) String companyName,
                @Pattern(regexp = "[A-Za-z]{2}", message = "Company country must be an ISO-3166 alpha-2 code") String companyCountry,
                @NotBlank @Size(max = 128) String deviceFingerprint,
                @NotBlank @Size(max = 32) String platform,
                @Size(max = 120) String deviceName,
                @Size(max = 16) String locale,
                @Size(max = 64) String timezone) {
}
