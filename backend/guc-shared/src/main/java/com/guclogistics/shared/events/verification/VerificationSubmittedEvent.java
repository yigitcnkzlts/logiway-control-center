package com.guclogistics.shared.events.verification;

import com.guclogistics.shared.domain.AbstractDomainEvent;

import java.util.UUID;

public class VerificationSubmittedEvent extends AbstractDomainEvent {

    private final UUID applicationId;
    private final String subjectType;
    private final UUID subjectId;
    private final UUID applicantUserId;

    public VerificationSubmittedEvent(UUID applicationId, String subjectType, UUID subjectId, UUID applicantUserId) {
        this.applicationId = applicationId;
        this.subjectType = subjectType;
        this.subjectId = subjectId;
        this.applicantUserId = applicantUserId;
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

    @Override
    public String eventType() {
        return "VerificationSubmitted";
    }
}
