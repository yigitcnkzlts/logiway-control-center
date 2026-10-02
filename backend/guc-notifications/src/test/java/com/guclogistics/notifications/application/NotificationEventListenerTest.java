package com.guclogistics.notifications.application;

import com.guclogistics.identity.domain.event.SuspiciousLoginDetectedEvent;
import com.guclogistics.identity.domain.event.UserLoggedInEvent;
import com.guclogistics.shared.events.matching.MatchCreatedEvent;
import com.guclogistics.shared.events.offers.OfferAcceptedEvent;
import com.guclogistics.shared.events.verification.VerificationApprovedEvent;
import com.guclogistics.shared.events.verification.VerificationRejectedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    @Mock private NotificationService notificationService;

    @InjectMocks
    private NotificationEventListener listener;

    @Test
    void onSuspiciousLoginNotifiesUser() {
        UUID userId = UUID.randomUUID();
        listener.onSuspiciousLogin(new SuspiciousLoginDetectedEvent(userId, "1.2.3.4", "too many attempts"));

        verify(notificationService).notify(eq(userId), eq("SECURITY_ALERT"), any(), any(), any());
    }

    @Test
    void onNewDeviceLoginNotifiesWhenNewDevice() {
        UUID userId = UUID.randomUUID();
        listener.onNewDeviceLogin(new UserLoggedInEvent(userId, UUID.randomUUID(), "1.2.3.4", true));

        verify(notificationService).notify(eq(userId), eq("NEW_DEVICE_LOGIN"), any(), any(), any());
    }

    @Test
    void onNewDeviceLoginSkipsKnownDevice() {
        listener.onNewDeviceLogin(new UserLoggedInEvent(UUID.randomUUID(), UUID.randomUUID(), "1.2.3.4", false));

        verify(notificationService, never()).notify(any(), any(), any(), any(), any());
    }

    @Test
    void onOfferAcceptedNotifiesBothParties() {
        UUID offererUser = UUID.randomUUID();
        UUID ownerUser = UUID.randomUUID();
        listener.onOfferAccepted(new OfferAcceptedEvent(
                UUID.randomUUID(), UUID.randomUUID(), ownerUser, "DRIVER", UUID.randomUUID(), offererUser));

        verify(notificationService, times(2)).notify(any(), eq("OFFER_ACCEPTED"), any(), any(), any());
    }

    @Test
    void onMatchCreatedNotifiesBothParties() {
        listener.onMatchCreated(new MatchCreatedEvent(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));

        verify(notificationService, times(2)).notify(any(), eq("MATCH_CREATED"), any(), any(), any());
    }

    @Test
    void onVerificationApprovedNotifiesApplicant() {
        UUID applicantId = UUID.randomUUID();
        listener.onVerificationApproved(new VerificationApprovedEvent(
                UUID.randomUUID(), "COMPANY", UUID.randomUUID(), applicantId, UUID.randomUUID()));

        verify(notificationService).notify(eq(applicantId), eq("VERIFICATION_APPROVED"), any(), any(), any());
    }

    @Test
    void onVerificationRejectedNotifiesApplicant() {
        UUID applicantId = UUID.randomUUID();
        listener.onVerificationRejected(new VerificationRejectedEvent(
                UUID.randomUUID(), "COMPANY", UUID.randomUUID(), applicantId, UUID.randomUUID(), "bad docs"));

        verify(notificationService).notify(eq(applicantId), eq("VERIFICATION_REJECTED"), any(), any(), any());
    }
}
