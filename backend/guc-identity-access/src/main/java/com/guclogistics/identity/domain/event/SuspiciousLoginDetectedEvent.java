package com.guclogistics.identity.domain.event;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class SuspiciousLoginDetectedEvent extends AbstractDomainEvent {

    private final UUID userId;
    private final String ipAddress;
    private final String reason;

    public SuspiciousLoginDetectedEvent(UUID userId, String ipAddress, String reason) {
        this.userId = userId;
        this.ipAddress = ipAddress;
        this.reason = reason;
    }

    public UUID userId() {
        return userId;
    }

    public String ipAddress() {
        return ipAddress;
    }

    public String reason() {
        return reason;
    }

    @Override
    public String eventType() {
        return "SuspiciousLoginDetected";
    }
}
