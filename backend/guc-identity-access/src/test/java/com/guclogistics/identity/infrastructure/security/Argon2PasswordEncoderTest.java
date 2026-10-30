package com.guclogistics.identity.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class Argon2PasswordEncoderTest {

    private final PasswordEncoder passwordEncoder =
            org.springframework.security.crypto.argon2.Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

    @Test
    void encodesAndMatchesPasswordWithArgon2id() {
        String rawPassword = "Safe-Test-Password-42!";

        String encodedPassword = passwordEncoder.encode(rawPassword);

        assertThat(encodedPassword).startsWith("$argon2id$");
        assertThat(passwordEncoder.matches(rawPassword, encodedPassword)).isTrue();
        assertThat(passwordEncoder.matches("Wrong-Test-Password-42!", encodedPassword)).isFalse();
    }
}
