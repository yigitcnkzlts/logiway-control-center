package com.guclogistics.identity.domain.event;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class UserRegisteredEvent extends AbstractDomainEvent {

    private final UUID userId;
    private final String email;
    private final String role;

    public UserRegisteredEvent(UUID userId, String email, String role) {
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    public UUID userId() {
        return userId;
    }

    public String email() {
        return email;
    }

    public String role() {
        return role;
    }

    @Override
    public String eventType() {
        return "UserRegistered";
    }
}
