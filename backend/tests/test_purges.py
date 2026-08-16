from datetime import date, datetime, time, timedelta, timezone
from app.models.user import User
from app.models.appointment import Appointment
from app.crud.user import purge_expired_deactivated_users
from app.crud.appointment import purge_stale_appointments


def test_deactivated_account_purged_after_30_days(db_session):
    old_deactivated = User(
        username="longgone", password_hash="x", full_name="Long Gone", role="Receptionist",
        is_active=False, deactivated_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=31),
    )
    recently_deactivated = User(
        username="recentlygone", password_hash="x", full_name="Recently Gone", role="Receptionist",
        is_active=False, deactivated_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=5),
    )
    db_session.add_all([old_deactivated, recently_deactivated])
    db_session.commit()

    purged = purge_expired_deactivated_users(db_session, days=30)
    assert purged == ["longgone"]

    remaining_usernames = {u.username for u in db_session.query(User).all()}
    assert "longgone" not in remaining_usernames
    assert "recentlygone" in remaining_usernames


def test_account_purge_runs_on_login_and_never_touches_active_accounts(client, db_session, admin_user):
    old_deactivated = User(
        username="shouldpurge", password_hash="x", full_name="Should Purge", role="Receptionist",
        is_active=False, deactivated_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=45),
    )
    db_session.add(old_deactivated)
    db_session.commit()

    client.post("/api/login", data={"username": "admin1", "password": "AdminPass1"})

    remaining_usernames = {u.username for u in db_session.query(User).all()}
    assert "shouldpurge" not in remaining_usernames
    assert "admin1" in remaining_usernames  # active accounts are untouched


def test_cancelled_appointments_are_purged(db_session, patient_record, doctor_record):
    cancelled = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                             appointment_date=date.today(), appointment_time=time(10, 0, 0), status="Cancelled")
    db_session.add(cancelled)
    db_session.commit()

    cancelled_count, overdue_count = purge_stale_appointments(db_session)
    assert cancelled_count == 1
    assert db_session.query(Appointment).count() == 0


def test_overdue_scheduled_appointments_are_purged_but_completed_ones_are_kept(db_session, patient_record, doctor_record):
    overdue = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                           appointment_date=date.today() - timedelta(days=2), appointment_time=time(10, 0, 0), status="Scheduled")
    completed = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                             appointment_date=date.today() - timedelta(days=2), appointment_time=time(11, 0, 0), status="Completed")
    future_scheduled = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                                    appointment_date=date.today() + timedelta(days=2), appointment_time=time(12, 0, 0), status="Scheduled")
    db_session.add_all([overdue, completed, future_scheduled])
    db_session.commit()

    cancelled_count, overdue_count = purge_stale_appointments(db_session)
    assert overdue_count == 1
    assert cancelled_count == 0

    remaining_statuses = {a.status for a in db_session.query(Appointment).all()}
    assert remaining_statuses == {"Completed", "Scheduled"}
    assert db_session.query(Appointment).count() == 2
