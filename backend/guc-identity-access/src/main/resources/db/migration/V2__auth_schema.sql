CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY,
    email           VARCHAR(320) NOT NULL UNIQUE,
    phone           VARCHAR(32),
    password_hash   VARCHAR(255) NOT NULL,
    status          VARCHAR(32)  NOT NULL,
    locale          VARCHAR(16)  NOT NULL DEFAULT 'en',
    timezone        VARCHAR(64)  NOT NULL DEFAULT 'UTC',
    locked_until    TIMESTAMPTZ  NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_devices (
    id                 UUID PRIMARY KEY,
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(128) NOT NULL,
    platform           VARCHAR(32)  NOT NULL,
    device_name        VARCHAR(120),
    last_seen_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    trusted            BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, device_fingerprint)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id           UUID REFERENCES user_devices(id),
    refresh_token_hash  VARCHAR(128) NOT NULL,
    family_id           UUID NOT NULL,
    ip_address          VARCHAR(64),
    user_agent          VARCHAR(512),
    expires_at          TIMESTAMPTZ  NOT NULL,
    revoked_at          TIMESTAMPTZ  NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh ON user_sessions (refresh_token_hash);

CREATE TABLE IF NOT EXISTS mfa_settings (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    totp_secret_enc  TEXT NOT NULL,
    enabled          BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at      TIMESTAMPTZ NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash  VARCHAR(128) NOT NULL,
    used_at    TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id         UUID PRIMARY KEY,
    identifier VARCHAR(320) NOT NULL,
    ip_address VARCHAR(64)  NOT NULL,
    success    BOOLEAN      NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_time ON login_attempts (identifier, created_at DESC);

INSERT INTO roles (id, name, description) VALUES
    ('11111111-1111-1111-1111-111111111101', 'SHIPPER', 'Freight shipper company user'),
    ('11111111-1111-1111-1111-111111111102', 'LOGISTICS_COMPANY', 'Logistics company user'),
    ('11111111-1111-1111-1111-111111111103', 'INDEPENDENT_DRIVER', 'Independent driver'),
    ('11111111-1111-1111-1111-111111111104', 'FLEET_OWNER', 'Fleet owner'),
    ('11111111-1111-1111-1111-111111111105', 'ADMIN', 'Platform administrator'),
    ('11111111-1111-1111-1111-111111111106', 'SUPPORT', 'Support agent'),
    ('11111111-1111-1111-1111-111111111107', 'MODERATOR', 'Content/verification moderator')
ON CONFLICT (name) DO NOTHING;
