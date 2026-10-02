package com.guclogistics.shared.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guclogistics.shared.domain.DomainEvent;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OutboxEventWriter {

    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public void write(DomainEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            entityManager.createNativeQuery("""
                            INSERT INTO outbox_events (id, event_type, payload_json, created_at, processed_at)
                            VALUES (?, ?, CAST(? AS jsonb), NOW(), NULL)
                            """)
                    .setParameter(1, event.eventId())
                    .setParameter(2, event.eventType())
                    .setParameter(3, payload)
                    .executeUpdate();
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize domain event", e);
        }
    }
}
