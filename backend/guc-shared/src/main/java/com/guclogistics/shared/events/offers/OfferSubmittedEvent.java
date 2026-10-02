package com.guclogistics.shared.events.offers;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.math.BigDecimal;
import java.util.UUID;

public class OfferSubmittedEvent extends AbstractDomainEvent {

    private final UUID offerId;
    private final UUID loadId;
    private final String offererType;
    private final UUID offererId;
    private final UUID createdByUserId;
    private final BigDecimal amount;
    private final String currency;

    public OfferSubmittedEvent(
            UUID offerId,
            UUID loadId,
            String offererType,
            UUID offererId,
            UUID createdByUserId,
            BigDecimal amount,
            String currency
    ) {
        this.offerId = offerId;
        this.loadId = loadId;
        this.offererType = offererType;
        this.offererId = offererId;
        this.createdByUserId = createdByUserId;
        this.amount = amount;
        this.currency = currency;
    }

    public UUID offerId() {
        return offerId;
    }

    public UUID loadId() {
        return loadId;
    }

    public String offererType() {
        return offererType;
    }

    public UUID offererId() {
        return offererId;
    }

    public UUID createdByUserId() {
        return createdByUserId;
    }

    public BigDecimal amount() {
        return amount;
    }

    public String currency() {
        return currency;
    }

    @Override
    public String eventType() {
        return "OfferSubmitted";
    }
}
