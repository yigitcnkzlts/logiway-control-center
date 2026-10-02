package com.guclogistics.identity.infrastructure.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TokenHasherTest {

    private final TokenHasher tokenHasher = new TokenHasher();

    @Test
    void sha256ProducesConsistentHexDigest() {
        String hash1 = tokenHasher.sha256("refresh-token-value");
        String hash2 = tokenHasher.sha256("refresh-token-value");

        assertThat(hash1).isEqualTo(hash2);
        assertThat(hash1).matches("[0-9a-f]{64}");
    }

    @Test
    void sha256DiffersForDifferentInputs() {
        String hash1 = tokenHasher.sha256("token-a");
        String hash2 = tokenHasher.sha256("token-b");

        assertThat(hash1).isNotEqualTo(hash2);
    }
}
