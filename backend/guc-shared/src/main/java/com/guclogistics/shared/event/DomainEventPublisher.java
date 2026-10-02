package com.guclogistics.shared.event;

import com.guclogistics.shared.domain.DomainEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DomainEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final OutboxEventWriter outboxEventWriter;

    public void publish(DomainEvent event) {
        outboxEventWriter.write(event);
        applicationEventPublisher.publishEvent(event);
    }
}
