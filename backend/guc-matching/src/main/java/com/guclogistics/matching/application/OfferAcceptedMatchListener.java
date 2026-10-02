package com.guclogistics.matching.application;

import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class OfferAcceptedMatchListener {

    private final MatchService matchService;

    @EventListener
    @Transactional
    public void onOfferAccepted(OfferAcceptedEvent event) {
        matchService.createFromAcceptedOffer(event);
    }
}
