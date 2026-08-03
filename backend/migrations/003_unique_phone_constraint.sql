-- Migration: enforce unique phone numbers on user accounts (email was
-- already unique). This is checked across ALL roles - Admin, Receptionist,
-- Doctor, and Patient accounts all share one phone-number namespace, so no
-- two logins of any role can use the same number.
--
-- NULL/blank phone numbers are exempt (Postgres allows multiple NULLs in a
-- UNIQUE column), so accounts without a phone on file are unaffected.
--
-- If this fails with a duplicate-key error, it means two existing accounts
-- already share the same phone number - fix that manually first (update
-- one of them), then re-run this file.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
