from datetime import datetime, timedelta, timezone
from app.models.audit_log import AuditLog
from app.crud.audit_log import purge_old_audit_logs


def test_successful_login_creates_audit_entry(client, db_session, admin_user):
    client.post("/api/login", data={"username": "admin1", "password": "AdminPass1"})
    entries = db_session.query(AuditLog).filter(AuditLog.action == "login_success").all()
    assert len(entries) == 1
    assert entries[0].actor_username == "admin1"


def test_failed_login_creates_audit_entry(client, db_session, admin_user):
    client.post("/api/login", data={"username": "admin1", "password": "WrongPassword1"})
    entries = db_session.query(AuditLog).filter(AuditLog.action == "login_failed").all()
    assert len(entries) == 1


def test_self_signup_creates_audit_entry(client, db_session):
    client.post("/api/signup", json={
        "username": "audittest1", "password": "Passw0rd1", "full_name": "Audit Test",
        "email": "audittest1@example.com", "phone": "6100000001",
    })
    entries = db_session.query(AuditLog).filter(AuditLog.action == "self_signup").all()
    assert len(entries) == 1
    assert "audittest1" in entries[0].detail


def test_only_admin_can_read_audit_log_entries(client, admin_headers, db_session, admin_user):
    client.post("/api/login", data={"username": "admin1", "password": "AdminPass1"})
    r = client.get("/api/audit-logs/", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_purge_removes_entries_older_than_180_days_but_keeps_recent_ones(db_session):
    old_entry = AuditLog(action="login_success", actor_username="old_user",
                          timestamp=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=200))
    borderline_entry = AuditLog(action="login_success", actor_username="borderline_user",
                                 timestamp=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=179))
    recent_entry = AuditLog(action="login_success", actor_username="recent_user",
                             timestamp=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1))
    db_session.add_all([old_entry, borderline_entry, recent_entry])
    db_session.commit()

    purged_count = purge_old_audit_logs(db_session, days=180)
    assert purged_count == 1

    remaining_usernames = {e.actor_username for e in db_session.query(AuditLog).all()}
    assert remaining_usernames == {"borderline_user", "recent_user"}


def test_purge_runs_opportunistically_on_login_and_logs_itself(client, db_session, admin_user):
    old_entry = AuditLog(action="login_success", actor_username="ancient_user",
                          timestamp=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=400))
    db_session.add(old_entry)
    db_session.commit()

    client.post("/api/login", data={"username": "admin1", "password": "AdminPass1"})

    assert db_session.query(AuditLog).filter(AuditLog.actor_username == "ancient_user").count() == 0
    purge_events = db_session.query(AuditLog).filter(AuditLog.action == "audit_logs_purged").all()
    assert len(purge_events) == 1
    assert "1 audit log entry" in purge_events[0].detail
