-- Migration: track when an account was deactivated, so we can auto-purge
-- it 30 days later.
--
-- For accounts that are ALREADY deactivated as of this migration, we don't
-- know exactly when that happened historically, so we start the 30-day
-- clock from right now rather than assuming they're immediately overdue
-- for deletion.

ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;

UPDATE users
SET deactivated_at = NOW()
WHERE is_active = FALSE AND deactivated_at IS NULL;
