package com.guclogistics.shared.events.matching;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class MatchCreatedEvent extends AbstractDomainEvent {

    private final UUID matchId;
    private final UUID loadId;
    private final UUID offerId;
    private final UUID loadOwnerUserId;
    private final UUID offerCreatedByUserId;

    public MatchCreatedEvent(
            UUID matchId,
            UUID loadId,
            UUID offerId,
            UUID loadOwnerUserId,
            UUID offerCreatedByUserId
    ) {
        this.matchId = matchId;
        this.loadId = loadId;
        this.offerId = offerId;
        this.loadOwnerUserId = loadOwnerUserId;
        this.offerCreatedByUserId = offerCreatedByUserId;
    }

    public UUID matchId() {
        return matchId;
    }

    public UUID loadId() {
        return loadId;
    }

    public UUID offerId() {
        return offerId;
    }

    public UUID loadOwnerUserId() {
        return loadOwnerUserId;
    }

    public UUID offerCreatedByUserId() {
        return offerCreatedByUserId;
    }

    @Override
    public String eventType() {
        return "MatchCreated";
    }
}
