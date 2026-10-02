package com.guclogistics.identity.application.dto;

import java.util.List;

public record MfaEnrollResponse(String otpAuthUri, String secret, List<String> recoveryCodes) {
}
