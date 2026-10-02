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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditEventListenerTest {

    @Mock private AuditService auditService;

    @InjectMocks
    private AuditEventListener listener;

    @Test
    void onUserRegistered() {
        UUID userId = UUID.randomUUID();
        listener.onUserRegistered(new UserRegisteredEvent(userId, "a@b.com", "SHIPPER"));
        verify(auditService).record(eq(userId), eq("USER_REGISTERED"), eq("User"), eq(userId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onUserLoggedIn() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        listener.onUserLoggedIn(new UserLoggedInEvent(userId, sessionId, "127.0.0.1", false));
        verify(auditService).record(eq(userId), eq("USER_LOGGED_IN"), eq("Session"), eq(sessionId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onSuspiciousLogin() {
        UUID userId = UUID.randomUUID();
        listener.onSuspiciousLogin(new SuspiciousLoginDetectedEvent(userId, null, "rate limit"));
        verify(auditService).record(eq(userId), eq("SUSPICIOUS_LOGIN"), eq("User"), eq(userId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onSessionRevoked() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        listener.onSessionRevoked(new SessionRevokedEvent(userId, sessionId));
        verify(auditService).record(eq(userId), eq("SESSION_REVOKED"), eq("Session"), eq(sessionId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onVerificationSubmitted() {
        UUID applicantId = UUID.randomUUID();
        UUID appId = UUID.randomUUID();
        listener.onVerificationSubmitted(new VerificationSubmittedEvent(appId, "COMPANY", UUID.randomUUID(), applicantId));
        verify(auditService).record(eq(applicantId), eq("VERIFICATION_SUBMITTED"), eq("VerificationApplication"), eq(appId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onVerificationApproved() {
        UUID reviewerId = UUID.randomUUID();
        UUID appId = UUID.randomUUID();
        listener.onVerificationApproved(new VerificationApprovedEvent(appId, "COMPANY", UUID.randomUUID(), UUID.randomUUID(), reviewerId));
        verify(auditService).record(eq(reviewerId), eq("VERIFICATION_APPROVED"), eq("VerificationApplication"), eq(appId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onVerificationRejected() {
        UUID reviewerId = UUID.randomUUID();
        UUID appId = UUID.randomUUID();
        listener.onVerificationRejected(new VerificationRejectedEvent(appId, "COMPANY", UUID.randomUUID(), UUID.randomUUID(), reviewerId, "reason"));
        verify(auditService).record(eq(reviewerId), eq("VERIFICATION_REJECTED"), eq("VerificationApplication"), eq(appId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onOfferSubmitted() {
        UUID userId = UUID.randomUUID();
        UUID offerId = UUID.randomUUID();
        listener.onOfferSubmitted(new OfferSubmittedEvent(offerId, UUID.randomUUID(), "COMPANY", UUID.randomUUID(), userId, BigDecimal.TEN, "EUR"));
        verify(auditService).record(eq(userId), eq("OFFER_SUBMITTED"), eq("Offer"), eq(offerId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onOfferAccepted() {
        UUID ownerId = UUID.randomUUID();
        UUID offerId = UUID.randomUUID();
        listener.onOfferAccepted(new OfferAcceptedEvent(offerId, UUID.randomUUID(), ownerId, "COMPANY", UUID.randomUUID(), UUID.randomUUID()));
        verify(auditService).record(eq(ownerId), eq("OFFER_ACCEPTED"), eq("Offer"), eq(offerId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onOfferRejected() {
        UUID rejectedBy = UUID.randomUUID();
        UUID offerId = UUID.randomUUID();
        listener.onOfferRejected(new OfferRejectedEvent(offerId, UUID.randomUUID(), UUID.randomUUID(), rejectedBy));
        verify(auditService).record(eq(rejectedBy), eq("OFFER_REJECTED"), eq("Offer"), eq(offerId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void onMatchCreated() {
        UUID ownerId = UUID.randomUUID();
        UUID matchId = UUID.randomUUID();
        listener.onMatchCreated(new MatchCreatedEvent(matchId, UUID.randomUUID(), UUID.randomUUID(), ownerId, UUID.randomUUID()));
        verify(auditService).record(eq(ownerId), eq("MATCH_CREATED"), eq("Match"), eq(matchId.toString()), org.mockito.ArgumentMatchers.anyMap());
    }
}
