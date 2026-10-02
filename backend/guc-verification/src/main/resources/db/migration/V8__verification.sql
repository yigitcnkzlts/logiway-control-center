CREATE TABLE verification_applications (
    id                 UUID PRIMARY KEY,
    subject_type       VARCHAR(20)  NOT NULL,
    subject_id         UUID         NOT NULL,
    status             VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    submitted_at       TIMESTAMPTZ,
    reviewed_by        UUID,
    decision_reason    VARCHAR(1000),
    applicant_user_id  UUID         NOT NULL,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_applications_applicant ON verification_applications (applicant_user_id);
CREATE INDEX idx_verification_applications_subject ON verification_applications (subject_type, subject_id);
CREATE INDEX idx_verification_applications_status ON verification_applications (status);

CREATE TABLE verification_documents (
    id              UUID PRIMARY KEY,
    application_id  UUID         NOT NULL REFERENCES verification_applications (id) ON DELETE CASCADE,
    doc_type        VARCHAR(50)  NOT NULL,
    storage_key     VARCHAR(500) NOT NULL,
    mime            VARCHAR(100) NOT NULL,
    size_bytes      BIGINT       NOT NULL,
    checksum_sha256 VARCHAR(64)  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_documents_application ON verification_documents (application_id);
