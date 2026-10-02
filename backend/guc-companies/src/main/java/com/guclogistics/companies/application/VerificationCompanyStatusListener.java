package com.guclogistics.companies.application;

import com.guclogistics.companies.domain.CompanyStatus;
import com.guclogistics.shared.events.verification.VerificationApprovedEvent;
import com.guclogistics.shared.events.verification.VerificationRejectedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class VerificationCompanyStatusListener {

    private final CompanyService companyService;

    @EventListener
    @Transactional
    public void onVerificationApproved(VerificationApprovedEvent event) {
        if (!"COMPANY".equals(event.subjectType())) {
            return;
        }
        companyService.updateStatusFromVerification(event.subjectId(), CompanyStatus.VERIFIED);
    }

    @EventListener
    @Transactional
    public void onVerificationRejected(VerificationRejectedEvent event) {
        if (!"COMPANY".equals(event.subjectType())) {
            return;
        }
        companyService.updateStatusFromVerification(event.subjectId(), CompanyStatus.REJECTED);
    }
}
