package com.guclogistics.shared.events.loads;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class LoadPublishedEvent extends AbstractDomainEvent {

    private final UUID loadId;
    private final UUID shipperCompanyId;
    private final UUID createdByUserId;
    private final String title;

    public LoadPublishedEvent(UUID loadId, UUID shipperCompanyId, UUID createdByUserId, String title) {
        this.loadId = loadId;
        this.shipperCompanyId = shipperCompanyId;
        this.createdByUserId = createdByUserId;
        this.title = title;
    }

    public UUID loadId() {
        return loadId;
    }

    public UUID shipperCompanyId() {
        return shipperCompanyId;
    }

    public UUID createdByUserId() {
        return createdByUserId;
    }

    public String title() {
        return title;
    }

    @Override
    public String eventType() {
        return "LoadPublished";
    }
}
