package com.guclogistics.notifications.application;

import com.guclogistics.identity.domain.event.SuspiciousLoginDetectedEvent;
import com.guclogistics.identity.domain.event.UserLoggedInEvent;
import com.guclogistics.shared.events.matching.MatchCreatedEvent;
import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import com.guclogistics.shared.events.verification.VerificationApprovedEvent;
import com.guclogistics.shared.events.verification.VerificationRejectedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @EventListener
    public void onSuspiciousLogin(SuspiciousLoginDetectedEvent event) {
        notificationService.notify(
                event.userId(),
                "SECURITY_ALERT",
                "Suspicious login detected",
                event.reason(),
                Map.of("ip", event.ipAddress() != null ? event.ipAddress() : "")
        );
    }

    @EventListener
    public void onNewDeviceLogin(UserLoggedInEvent event) {
        if (!event.newDevice()) {
            return;
        }
        notificationService.notify(
                event.userId(),
                "NEW_DEVICE_LOGIN",
                "New device signed in",
                "A new device was used to access your account.",
                Map.of("sessionId", event.sessionId().toString())
        );
    }

    @EventListener
    public void onOfferAccepted(OfferAcceptedEvent event) {
        notificationService.notify(
                event.offerCreatedByUserId(),
                "OFFER_ACCEPTED",
                "Your offer was accepted",
                "Your offer on load " + event.loadId() + " has been accepted.",
                Map.of("offerId", event.offerId().toString(), "loadId", event.loadId().toString())
        );
        notificationService.notify(
                event.loadOwnerUserId(),
                "OFFER_ACCEPTED",
                "Offer accepted",
                "You accepted an offer on load " + event.loadId() + ".",
                Map.of("offerId", event.offerId().toString(), "loadId", event.loadId().toString())
        );
    }

    @EventListener
    public void onMatchCreated(MatchCreatedEvent event) {
        notificationService.notify(
                event.loadOwnerUserId(),
                "MATCH_CREATED",
                "Load matched",
                "Your load has been matched with an offer.",
                Map.of("matchId", event.matchId().toString(), "loadId", event.loadId().toString())
        );
        notificationService.notify(
                event.offerCreatedByUserId(),
                "MATCH_CREATED",
                "Match created",
                "A match was created for your offer.",
                Map.of("matchId", event.matchId().toString(), "offerId", event.offerId().toString())
        );
    }

    @EventListener
    public void onVerificationApproved(VerificationApprovedEvent event) {
        notificationService.notify(
                event.applicantUserId(),
                "VERIFICATION_APPROVED",
                "Verification approved",
                "Your verification application was approved.",
                Map.of("applicationId", event.applicationId().toString(), "subjectType", event.subjectType())
        );
    }

    @EventListener
    public void onVerificationRejected(VerificationRejectedEvent event) {
        notificationService.notify(
                event.applicantUserId(),
                "VERIFICATION_REJECTED",
                "Verification rejected",
                event.reason(),
                Map.of("applicationId", event.applicationId().toString(), "subjectType", event.subjectType())
        );
    }
}
