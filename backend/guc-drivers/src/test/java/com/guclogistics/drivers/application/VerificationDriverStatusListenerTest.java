package com.guclogistics.drivers.application;

import com.guclogistics.drivers.domain.DriverStatus;
import com.guclogistics.shared.events.verification.VerificationApprovedEvent;
import com.guclogistics.shared.events.verification.VerificationRejectedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class VerificationDriverStatusListenerTest {

    @Mock private DriverProfileService driverProfileService;

    @InjectMocks
    private VerificationDriverStatusListener listener;

    @Test
    void onVerificationApprovedUpdatesDriver() {
        UUID subjectId = UUID.randomUUID();
        listener.onVerificationApproved(new VerificationApprovedEvent(
                UUID.randomUUID(), "DRIVER", subjectId, UUID.randomUUID(), UUID.randomUUID()));

        verify(driverProfileService).updateStatusFromVerification(subjectId, DriverStatus.VERIFIED);
    }

    @Test
    void onVerificationApprovedIgnoresNonDriver() {
        listener.onVerificationApproved(new VerificationApprovedEvent(
                UUID.randomUUID(), "COMPANY", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));

        verify(driverProfileService, never()).updateStatusFromVerification(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void onVerificationRejectedUpdatesDriver() {
        UUID subjectId = UUID.randomUUID();
        listener.onVerificationRejected(new VerificationRejectedEvent(
                UUID.randomUUID(), "DRIVER", subjectId, UUID.randomUUID(), UUID.randomUUID(), "invalid"));

        verify(driverProfileService).updateStatusFromVerification(subjectId, DriverStatus.REJECTED);
    }

    @Test
    void onVerificationRejectedIgnoresNonDriver() {
        listener.onVerificationRejected(new VerificationRejectedEvent(
                UUID.randomUUID(), "COMPANY", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "reason"));

        verify(driverProfileService, never()).updateStatusFromVerification(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }
}
