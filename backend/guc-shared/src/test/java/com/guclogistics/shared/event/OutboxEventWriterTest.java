package com.guclogistics.shared.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guclogistics.shared.domain.DomainEvent;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxEventWriterTest {

    @Mock
    EntityManager entityManager;
    @Mock
    ObjectMapper objectMapper;
    @InjectMocks
    OutboxEventWriter writer;

    @Test
    void writeInsertsOutboxRow() throws Exception {
        Query query = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyInt(), any())).thenReturn(query);
        when(query.executeUpdate()).thenReturn(1);
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"type\":\"TestEvent\"}");

        DomainEvent event = new DomainEvent() {
            @Override
            public UUID eventId() {
                return UUID.randomUUID();
            }

            @Override
            public Instant occurredAt() {
                return Instant.now();
            }

            @Override
            public String eventType() {
                return "TestEvent";
            }
        };
        writer.write(event);
        verify(query).executeUpdate();
        verify(objectMapper).writeValueAsString(event);
    }

    @Test
    void writeWrapsSerializationFailure() throws Exception {
        when(objectMapper.writeValueAsString(any())).thenThrow(new com.fasterxml.jackson.core.JsonProcessingException("boom") {
        });
        DomainEvent event = new DomainEvent() {
            @Override
            public UUID eventId() {
                return UUID.randomUUID();
            }

            @Override
            public Instant occurredAt() {
                return Instant.now();
            }

            @Override
            public String eventType() {
                return "TestEvent";
            }
        };
        assertThatThrownBy(() -> writer.write(event))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Failed to serialize");
    }
}
