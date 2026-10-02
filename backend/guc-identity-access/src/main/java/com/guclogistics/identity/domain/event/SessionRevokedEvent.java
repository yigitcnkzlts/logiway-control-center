package com.guclogistics.identity.domain.event;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class SessionRevokedEvent extends AbstractDomainEvent {

    private final UUID userId;
    private final UUID sessionId;

    public SessionRevokedEvent(UUID userId, UUID sessionId) {
        this.userId = userId;
        this.sessionId = sessionId;
    }

    public UUID userId() {
        return userId;
    }

    public UUID sessionId() {
        return sessionId;
    }

    @Override
    public String eventType() {
        return "SessionRevoked";
    }
}
