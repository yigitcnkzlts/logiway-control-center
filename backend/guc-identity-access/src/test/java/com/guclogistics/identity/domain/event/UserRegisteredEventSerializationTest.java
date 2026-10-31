package com.guclogistics.identity.domain.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserRegisteredEventSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void serializesEventMetadataAndRegistrationPayload() throws Exception {
        UUID userId = UUID.randomUUID();
        UserRegisteredEvent event = new UserRegisteredEvent(userId, "new-user@example.com", "SHIPPER");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(event));

        assertThat(json.get("eventId").asText()).isEqualTo(event.eventId().toString());
        assertThat(json.get("occurredAt")).isNotNull();
        assertThat(json.get("userId").asText()).isEqualTo(userId.toString());
        assertThat(json.get("email").asText()).isEqualTo("new-user@example.com");
        assertThat(json.get("role").asText()).isEqualTo("SHIPPER");
    }
}
