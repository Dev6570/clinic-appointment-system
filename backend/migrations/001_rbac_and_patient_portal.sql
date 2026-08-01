-- Migration: role-based access control + patient/doctor login linking
--
-- This app creates tables with SQLAlchemy's create_all(), which only
-- creates tables that don't exist yet — it will NOT add new columns to a
-- table that's already there. Since `users` already exists in your database,
-- run this once against it manually before deploying the updated backend.
--
-- How to run it against your Render Postgres database:
--   1. Render dashboard -> your Postgres instance -> "Connect" -> copy the
--      "External Database URL" (psql command).
--   2. From your terminal:  psql "<paste the connection string>"
--   3. Paste the contents of this file at the psql prompt, or run:
--        psql "<connection string>" -f migrations/001_rbac_and_patient_portal.sql
--
-- Safe to run more than once — every statement uses IF NOT EXISTS.

ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_id INTEGER REFERENCES doctors(doctor_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS patient_id INTEGER REFERENCES patients(patient_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
