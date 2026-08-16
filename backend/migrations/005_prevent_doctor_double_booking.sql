-- Migration: prevent double-booking a doctor at the same date and time.
--
-- The application code (crud/appointment.py) has always had a try/except
-- around both create_appointment() and update_appointment() that catches
-- an IntegrityError and returns a clean "already booked" 409 error - but
-- until this migration, no actual database constraint backed that up, so
-- the same doctor could be booked twice at the exact same date and time
-- with no error at all. This migration is what makes that error-handling
-- code path actually reachable.
--
-- This is a PARTIAL unique index (WHERE status != 'Cancelled') rather than
-- a plain UNIQUE constraint, so a cancelled appointment doesn't
-- permanently block that same slot from being rebooked. This app has no
-- background scheduler - cancelled appointments are only cleaned up
-- opportunistically on login (see purge_stale_appointments) - so without
-- the partial condition, a freshly-cancelled slot could stay un-bookable
-- for a while.
--
-- If this fails with a duplicate-key error, it means the same doctor
-- already has two or more active (non-Cancelled) appointments booked at
-- the exact same date and time in your live data. Find them first with:
--
--   SELECT doctor_id, appointment_date, appointment_time, COUNT(*)
--   FROM appointments
--   WHERE status != 'Cancelled'
--   GROUP BY doctor_id, appointment_date, appointment_time
--   HAVING COUNT(*) > 1;
--
-- ...then manually reschedule or cancel the duplicates before re-running
-- this file.

DROP INDEX IF EXISTS ix_appointments_no_double_booking;
CREATE UNIQUE INDEX ix_appointments_no_double_booking
    ON appointments (doctor_id, appointment_date, appointment_time)
    WHERE status != 'Cancelled';
