-- Link Cognito users to Postgres accounts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cognito_sub ON users (cognito_sub) WHERE cognito_sub IS NOT NULL;
