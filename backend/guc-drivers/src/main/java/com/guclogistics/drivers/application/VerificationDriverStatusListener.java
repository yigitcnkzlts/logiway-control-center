package com.guclogistics.drivers.application;

import com.guclogistics.drivers.domain.DriverStatus;
import com.guclogistics.shared.events.verification.VerificationApprovedEvent;
import com.guclogistics.shared.events.verification.VerificationRejectedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class VerificationDriverStatusListener {

    private final DriverProfileService driverProfileService;

    @EventListener
    @Transactional
    public void onVerificationApproved(VerificationApprovedEvent event) {
        if (!"DRIVER".equals(event.subjectType())) {
            return;
        }
        driverProfileService.updateStatusFromVerification(event.subjectId(), DriverStatus.VERIFIED);
    }

    @EventListener
    @Transactional
    public void onVerificationRejected(VerificationRejectedEvent event) {
        if (!"DRIVER".equals(event.subjectType())) {
            return;
        }
        driverProfileService.updateStatusFromVerification(event.subjectId(), DriverStatus.REJECTED);
    }
}
