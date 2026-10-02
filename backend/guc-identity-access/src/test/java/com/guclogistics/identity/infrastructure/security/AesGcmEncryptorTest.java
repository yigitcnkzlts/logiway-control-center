package com.guclogistics.identity.infrastructure.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AesGcmEncryptorTest {

    private static final String VALID_KEY = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

    @Test
    void encryptDecryptRoundTrip() {
        AesGcmEncryptor encryptor = new AesGcmEncryptor(VALID_KEY);

        String plaintext = "super-secret-totp-key-base64";
        String encrypted = encryptor.encrypt(plaintext);

        assertThat(encrypted).isNotEqualTo(plaintext);
        assertThat(encryptor.decrypt(encrypted)).isEqualTo(plaintext);
    }

    @Test
    void eachEncryptionProducesDifferentCiphertext() {
        AesGcmEncryptor encryptor = new AesGcmEncryptor(VALID_KEY);

        String enc1 = encryptor.encrypt("same-plaintext");
        String enc2 = encryptor.encrypt("same-plaintext");

        assertThat(enc1).isNotEqualTo(enc2);
        assertThat(encryptor.decrypt(enc1)).isEqualTo("same-plaintext");
        assertThat(encryptor.decrypt(enc2)).isEqualTo("same-plaintext");
    }

    @Test
    void invalidKeyLengthFailsAtConstruction() {
        String shortKey = java.util.Base64.getEncoder().encodeToString(new byte[16]);

        assertThatThrownBy(() -> new AesGcmEncryptor(shortKey))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }
}
