package com.guclogistics.audit.application;

import com.guclogistics.identity.domain.event.SessionRevokedEvent;
import com.guclogistics.identity.domain.event.SuspiciousLoginDetectedEvent;
import com.guclogistics.identity.domain.event.UserLoggedInEvent;
import com.guclogistics.identity.domain.event.UserRegisteredEvent;
import com.guclogistics.shared.events.matching.MatchCreatedEvent;
import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import com.guclogistics.shared.events.offers.OfferRejectedEvent;
import com.guclogistics.shared.events.offers.OfferSubmittedEvent;
import com.guclogistics.shared.events.verification.VerificationApprovedEvent;
import com.guclogistics.shared.events.verification.VerificationRejectedEvent;
import com.guclogistics.shared.events.verification.VerificationSubmittedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AuditEventListener {

    private final AuditService auditService;

    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        auditService.record(event.userId(), "USER_REGISTERED", "User", event.userId().toString(),
                Map.of("email", event.email(), "role", event.role()));
    }

    @EventListener
    public void onUserLoggedIn(UserLoggedInEvent event) {
        auditService.record(event.userId(), "USER_LOGGED_IN", "Session", event.sessionId().toString(),
                Map.of("ip", nullToEmpty(event.ipAddress()), "newDevice", event.newDevice()));
    }

    @EventListener
    public void onSuspiciousLogin(SuspiciousLoginDetectedEvent event) {
        auditService.record(event.userId(), "SUSPICIOUS_LOGIN", "User", event.userId().toString(),
                Map.of("ip", nullToEmpty(event.ipAddress()), "reason", event.reason()));
    }

    @EventListener
    public void onSessionRevoked(SessionRevokedEvent event) {
        auditService.record(event.userId(), "SESSION_REVOKED", "Session", event.sessionId().toString(), Map.of());
    }

    @EventListener
    public void onVerificationSubmitted(VerificationSubmittedEvent event) {
        auditService.record(event.applicantUserId(), "VERIFICATION_SUBMITTED", "VerificationApplication",
                event.applicationId().toString(),
                Map.of("subjectType", event.subjectType(), "subjectId", event.subjectId().toString()));
    }

    @EventListener
    public void onVerificationApproved(VerificationApprovedEvent event) {
        auditService.record(event.reviewedByUserId(), "VERIFICATION_APPROVED", "VerificationApplication",
                event.applicationId().toString(),
                Map.of("subjectType", event.subjectType(), "subjectId", event.subjectId().toString(),
                        "applicantUserId", event.applicantUserId().toString()));
    }

    @EventListener
    public void onVerificationRejected(VerificationRejectedEvent event) {
        auditService.record(event.reviewedByUserId(), "VERIFICATION_REJECTED", "VerificationApplication",
                event.applicationId().toString(),
                Map.of("subjectType", event.subjectType(), "subjectId", event.subjectId().toString(),
                        "reason", event.reason()));
    }

    @EventListener
    public void onOfferSubmitted(OfferSubmittedEvent event) {
        auditService.record(event.createdByUserId(), "OFFER_SUBMITTED", "Offer", event.offerId().toString(),
                Map.of("loadId", event.loadId().toString(), "amount", event.amount(), "currency", event.currency()));
    }

    @EventListener
    public void onOfferAccepted(OfferAcceptedEvent event) {
        auditService.record(event.loadOwnerUserId(), "OFFER_ACCEPTED", "Offer", event.offerId().toString(),
                Map.of("loadId", event.loadId().toString(), "offererId", event.offererId().toString()));
    }

    @EventListener
    public void onOfferRejected(OfferRejectedEvent event) {
        auditService.record(event.rejectedByUserId(), "OFFER_REJECTED", "Offer", event.offerId().toString(),
                Map.of("loadId", event.loadId().toString()));
    }

    @EventListener
    public void onMatchCreated(MatchCreatedEvent event) {
        auditService.record(event.loadOwnerUserId(), "MATCH_CREATED", "Match", event.matchId().toString(),
                Map.of("loadId", event.loadId().toString(), "offerId", event.offerId().toString()));
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
