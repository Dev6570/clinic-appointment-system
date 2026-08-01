-- Migration: update the role check constraint + normalize existing values
--
-- The `users` table had a CHECK constraint only allowing lowercase
-- 'admin' | 'doctor' | 'receptionist' — no 'patient' at all. The RBAC code
-- uses 'Admin' | 'Receptionist' | 'Doctor' | 'Patient'. This replaces the
-- constraint to match what the app actually needs (adding Patient support),
-- then normalizes any existing rows to the new casing.
--
-- Safe to run more than once.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users SET role = 'Admin'        WHERE LOWER(role) = 'admin';
UPDATE users SET role = 'Receptionist' WHERE LOWER(role) = 'receptionist';
UPDATE users SET role = 'Doctor'       WHERE LOWER(role) = 'doctor';
UPDATE users SET role = 'Patient'      WHERE LOWER(role) = 'patient';

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('Admin', 'Receptionist', 'Doctor', 'Patient'));
