package com.guclogistics.identity.infrastructure.security;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class TotpService {

    private static final int TIME_STEP_SECONDS = 30;
    private static final int CODE_DIGITS = 6;
    private static final int SECRET_BYTES = 20;
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateSecret() {
        byte[] buffer = new byte[SECRET_BYTES];
        secureRandom.nextBytes(buffer);
        return Base64.getEncoder().encodeToString(buffer);
    }

    public String otpAuthUri(String issuer, String account, String secretBase64) {
        String secretBase32 = base32Encode(Base64.getDecoder().decode(secretBase64));
        return "otpauth://totp/" + issuer + ":" + account
                + "?secret=" + secretBase32
                + "&issuer=" + issuer
                + "&digits=" + CODE_DIGITS
                + "&period=" + TIME_STEP_SECONDS;
    }

    public boolean verify(String secretBase64, String code) {
        if (code == null || !code.matches("\\d{6}")) {
            return false;
        }
        long currentStep = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;
        for (long drift = -1; drift <= 1; drift++) {
            if (generateCode(secretBase64, currentStep + drift).equals(code)) {
                return true;
            }
        }
        return false;
    }

    private String generateCode(String secretBase64, long timeStep) {
        try {
            byte[] key = Base64.getDecoder().decode(secretBase64);
            byte[] data = ByteBuffer.allocate(8).putLong(timeStep).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % (int) Math.pow(10, CODE_DIGITS);
            return String.format("%0" + CODE_DIGITS + "d", otp);
        } catch (Exception e) {
            throw new IllegalStateException("TOTP generation failed", e);
        }
    }

    private static String base32Encode(byte[] data) {
        String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        StringBuilder result = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                result.append(alphabet.charAt((buffer >> (bitsLeft - 5)) & 0x1F));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            result.append(alphabet.charAt((buffer << (5 - bitsLeft)) & 0x1F));
        }
        return result.toString();
    }
}
