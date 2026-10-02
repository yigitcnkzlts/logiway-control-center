package com.guclogistics.matching.application;

import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OfferAcceptedMatchListenerTest {

    @Mock private MatchService matchService;

    @InjectMocks
    private OfferAcceptedMatchListener listener;

    @Test
    void onOfferAcceptedCreatesMatch() {
        OfferAcceptedEvent event = new OfferAcceptedEvent(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "DRIVER",
                UUID.randomUUID(), UUID.randomUUID());

        listener.onOfferAccepted(event);

        verify(matchService).createFromAcceptedOffer(event);
    }
}
