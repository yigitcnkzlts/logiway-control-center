package com.guclogistics.shared.events.offers;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class OfferRejectedEvent extends AbstractDomainEvent {

    private final UUID offerId;
    private final UUID loadId;
    private final UUID offerCreatedByUserId;
    private final UUID rejectedByUserId;

    public OfferRejectedEvent(UUID offerId, UUID loadId, UUID offerCreatedByUserId, UUID rejectedByUserId) {
        this.offerId = offerId;
        this.loadId = loadId;
        this.offerCreatedByUserId = offerCreatedByUserId;
        this.rejectedByUserId = rejectedByUserId;
    }

    public UUID offerId() {
        return offerId;
    }

    public UUID loadId() {
        return loadId;
    }

    public UUID offerCreatedByUserId() {
        return offerCreatedByUserId;
    }

    public UUID rejectedByUserId() {
        return rejectedByUserId;
    }

    @Override
    public String eventType() {
        return "OfferRejected";
    }
}
