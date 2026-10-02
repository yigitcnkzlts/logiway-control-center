package com.guclogistics.shared.event;

import com.guclogistics.shared.domain.AbstractDomainEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class DomainEventPublisherTest {

    @Mock
    ApplicationEventPublisher applicationEventPublisher;
    @Mock
    OutboxEventWriter outboxEventWriter;
    @InjectMocks
    DomainEventPublisher publisher;

    @Test
    void publishWritesOutboxAndApplicationEvent() {
        var event = new AbstractDomainEvent() {
            @Override
            public String eventType() {
                return "TestEvent";
            }
        };
        publisher.publish(event);
        verify(outboxEventWriter).write(same(event));
        verify(applicationEventPublisher).publishEvent(same(event));
    }
}
