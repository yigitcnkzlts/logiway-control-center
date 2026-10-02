package com.guclogistics.shared.events.verification;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class VerificationRejectedEvent extends AbstractDomainEvent {

    private final UUID applicationId;
    private final String subjectType;
    private final UUID subjectId;
    private final UUID applicantUserId;
    private final UUID reviewedByUserId;
    private final String reason;

    public VerificationRejectedEvent(
            UUID applicationId,
            String subjectType,
            UUID subjectId,
            UUID applicantUserId,
            UUID reviewedByUserId,
            String reason
    ) {
        this.applicationId = applicationId;
        this.subjectType = subjectType;
        this.subjectId = subjectId;
        this.applicantUserId = applicantUserId;
        this.reviewedByUserId = reviewedByUserId;
        this.reason = reason;
    }

    public UUID applicationId() {
        return applicationId;
    }

    public String subjectType() {
        return subjectType;
    }

    public UUID subjectId() {
        return subjectId;
    }

    public UUID applicantUserId() {
        return applicantUserId;
    }

    public UUID reviewedByUserId() {
        return reviewedByUserId;
    }

    public String reason() {
        return reason;
    }

    @Override
    public String eventType() {
        return "VerificationRejected";
    }
}
