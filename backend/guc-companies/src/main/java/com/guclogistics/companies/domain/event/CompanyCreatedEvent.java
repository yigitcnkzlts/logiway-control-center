package com.guclogistics.companies.domain.event;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class CompanyCreatedEvent extends AbstractDomainEvent {

    private final UUID companyId;
    private final UUID createdByUserId;
    private final String type;
    private final String legalName;

    public CompanyCreatedEvent(UUID companyId, UUID createdByUserId, String type, String legalName) {
        this.companyId = companyId;
        this.createdByUserId = createdByUserId;
        this.type = type;
        this.legalName = legalName;
    }

    public UUID companyId() {
        return companyId;
    }

    public UUID createdByUserId() {
        return createdByUserId;
    }

    public String type() {
        return type;
    }

    public String legalName() {
        return legalName;
    }

    @Override
    public String eventType() {
        return "CompanyCreated";
    }
}
