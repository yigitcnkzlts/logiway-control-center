package com.guclogistics.identity.domain.event;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class UserLoggedInEvent extends AbstractDomainEvent {

    private final UUID userId;
    private final UUID sessionId;
    private final String ipAddress;
    private final boolean newDevice;

    public UserLoggedInEvent(UUID userId, UUID sessionId, String ipAddress, boolean newDevice) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.ipAddress = ipAddress;
        this.newDevice = newDevice;
    }

    public UUID userId() {
        return userId;
    }

    public UUID sessionId() {
        return sessionId;
    }

    public String ipAddress() {
        return ipAddress;
    }

    public boolean newDevice() {
        return newDevice;
    }

    @Override
    public String eventType() {
        return "UserLoggedIn";
    }
}
