package com.guclogistics.shared.events.identity;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class UserCompanyRegistrationRequestedEvent extends AbstractDomainEvent {
    private final UUID userId;
    private final String role;
    private final String companyName;
    private final String companyCountry;

    public UserCompanyRegistrationRequestedEvent(UUID userId, String role, String companyName, String companyCountry) {
        this.userId = userId;
        this.role = role;
        this.companyName = companyName;
        this.companyCountry = companyCountry;
    }

    public UUID userId() {
        return userId;
    }

    public String role() {
        return role;
    }

    public String companyName() {
        return companyName;
    }

    public String companyCountry() {
        return companyCountry;
    }

    @Override
    public String eventType() {
        return "UserCompanyRegistrationRequested";
    }
}
