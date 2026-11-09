CREATE TABLE company_member_invitations (
    id                  UUID PRIMARY KEY,
    company_id          UUID         NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    email               VARCHAR(320) NOT NULL,
    member_role         VARCHAR(20)  NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    invited_by_user_id  UUID         NOT NULL REFERENCES users (id),
    accepted_by_user_id UUID REFERENCES users (id),
    expires_at          TIMESTAMPTZ  NOT NULL,
    accepted_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_company_member_invitations_company
    ON company_member_invitations (company_id, created_at DESC);

CREATE INDEX idx_company_member_invitations_email
    ON company_member_invitations (LOWER(email), status, expires_at DESC);

CREATE UNIQUE INDEX idx_company_member_invitations_pending
    ON company_member_invitations (company_id, LOWER(email))
    WHERE status = 'PENDING';
