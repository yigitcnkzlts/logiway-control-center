package com.guclogistics.companies.application;

import com.guclogistics.companies.domain.CompanyStatus;
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
class VerificationCompanyStatusListenerTest {

    @Mock private CompanyService companyService;

    @InjectMocks
    private VerificationCompanyStatusListener listener;

    @Test
    void onVerificationApprovedUpdatesCompany() {
        UUID subjectId = UUID.randomUUID();
        listener.onVerificationApproved(new VerificationApprovedEvent(
                UUID.randomUUID(), "COMPANY", subjectId, UUID.randomUUID(), UUID.randomUUID()));

        verify(companyService).updateStatusFromVerification(subjectId, CompanyStatus.VERIFIED);
    }

    @Test
    void onVerificationApprovedIgnoresNonCompany() {
        listener.onVerificationApproved(new VerificationApprovedEvent(
                UUID.randomUUID(), "DRIVER", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));

        verify(companyService, never()).updateStatusFromVerification(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void onVerificationRejectedUpdatesCompany() {
        UUID subjectId = UUID.randomUUID();
        listener.onVerificationRejected(new VerificationRejectedEvent(
                UUID.randomUUID(), "COMPANY", subjectId, UUID.randomUUID(), UUID.randomUUID(), "bad docs"));

        verify(companyService).updateStatusFromVerification(subjectId, CompanyStatus.REJECTED);
    }

    @Test
    void onVerificationRejectedIgnoresNonCompany() {
        listener.onVerificationRejected(new VerificationRejectedEvent(
                UUID.randomUUID(), "DRIVER", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "reason"));

        verify(companyService, never()).updateStatusFromVerification(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }
}
