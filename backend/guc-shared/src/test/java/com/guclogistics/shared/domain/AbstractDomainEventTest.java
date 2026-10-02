package com.guclogistics.shared.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AbstractDomainEventTest {

    @Test
    void assignsEventIdAndTimestamp() {
        DomainEvent event = new AbstractDomainEvent() {
            @Override
            public String eventType() {
                return "Sample";
            }
        };
        assertThat(event.eventId()).isNotNull();
        assertThat(event.occurredAt()).isNotNull();
        assertThat(event.eventType()).isEqualTo("Sample");
    }
}
