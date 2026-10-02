package com.guclogistics.shared.events.offers;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class OfferAcceptedEvent extends AbstractDomainEvent {

    private final UUID offerId;
    private final UUID loadId;
    private final UUID loadOwnerUserId;
    private final String offererType;
    private final UUID offererId;
    private final UUID offerCreatedByUserId;

    public OfferAcceptedEvent(
            UUID offerId,
            UUID loadId,
            UUID loadOwnerUserId,
            String offererType,
            UUID offererId,
            UUID offerCreatedByUserId
    ) {
        this.offerId = offerId;
        this.loadId = loadId;
        this.loadOwnerUserId = loadOwnerUserId;
        this.offererType = offererType;
        this.offererId = offererId;
        this.offerCreatedByUserId = offerCreatedByUserId;
    }

    public UUID offerId() {
        return offerId;
    }

    public UUID loadId() {
        return loadId;
    }

    public UUID loadOwnerUserId() {
        return loadOwnerUserId;
    }

    public String offererType() {
        return offererType;
    }

    public UUID offererId() {
        return offererId;
    }

    public UUID offerCreatedByUserId() {
        return offerCreatedByUserId;
    }

    @Override
    public String eventType() {
        return "OfferAccepted";
    }
}
