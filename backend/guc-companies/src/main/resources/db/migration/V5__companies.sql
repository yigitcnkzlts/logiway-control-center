CREATE TABLE companies (
    id                  UUID PRIMARY KEY,
    type                VARCHAR(20)  NOT NULL,
    legal_name          VARCHAR(255) NOT NULL,
    trade_name          VARCHAR(255),
    vat_number          VARCHAR(50),
    country             CHAR(2)      NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_by_user_id  UUID         NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_created_by ON companies (created_by_user_id);
CREATE INDEX idx_companies_status ON companies (status);

CREATE TABLE company_members (
    company_id   UUID        NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL,
    member_role  VARCHAR(20) NOT NULL,
    PRIMARY KEY (company_id, user_id)
);

CREATE INDEX idx_company_members_user ON company_members (user_id);
