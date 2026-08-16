from app.models.patient import Patient
from app.models.user import User


def _signup_payload(**overrides):
    payload = {
        "username": "newpatient1",
        "password": "Passw0rd1",
        "full_name": "New Patient",
        "email": "newpatient1@example.com",
        "phone": "2000000001",
        "age": 25,
        "gender": "Female",
        "address": "1 Test Street",
    }
    payload.update(overrides)
    return payload


def test_signup_creates_new_patient_and_account(client, db_session):
    r = client.post("/api/signup", json=_signup_payload())
    assert r.status_code == 201
    body = r.json()
    assert body["role"] == "Patient"
    assert body["patient_id"] is not None

    patient = db_session.query(Patient).filter(Patient.patient_id == body["patient_id"]).first()
    assert patient is not None
    assert patient.email == "newpatient1@example.com"


def test_signup_lets_new_account_log_in_immediately(client):
    client.post("/api/signup", json=_signup_payload())
    r = client.post("/api/login", data={"username": "newpatient1", "password": "Passw0rd1"})
    assert r.status_code == 200


def test_signup_links_to_existing_patient_with_no_login(client, db_session, patient_record):
    """patient_record fixture has no linked User yet - signup with matching
    email should attach to it instead of creating a duplicate patient."""
    r = client.post("/api/signup", json=_signup_payload(
        username="ariveraLogin", email=patient_record.email, phone=patient_record.phone,
    ))
    assert r.status_code == 201
    assert r.json()["patient_id"] == patient_record.patient_id

    total_patients = db_session.query(Patient).count()
    assert total_patients == 1, "signup should have linked, not duplicated, the existing patient"


def test_signup_rejects_patient_record_already_linked_to_a_login(client, patient_record, patient_user):
    """patient_user fixture already links patient_record to a login."""
    r = client.post("/api/signup", json=_signup_payload(
        username="someoneelse", email=patient_record.email, phone=patient_record.phone,
    ))
    assert r.status_code == 409
    assert "already exists for this patient record" in r.json()["detail"]


def test_signup_rejects_duplicate_username(client, admin_user):
    r = client.post("/api/signup", json=_signup_payload(username="admin1"))
    assert r.status_code == 409
    assert "username" in r.json()["detail"].lower()


def test_signup_rejects_email_belonging_to_a_different_account(client, admin_user):
    r = client.post("/api/signup", json=_signup_payload(email=admin_user.email, phone="2099999999"))
    assert r.status_code == 409
    assert "email" in r.json()["detail"].lower()


def test_signup_rejects_phone_belonging_to_a_different_account(client, admin_user):
    r = client.post("/api/signup", json=_signup_payload(email="unique_email@example.com", phone=admin_user.phone))
    assert r.status_code == 409
    assert "phone" in r.json()["detail"].lower()


def test_signup_weak_password_rejected(client):
    r = client.post("/api/signup", json=_signup_payload(password="weak"))
    assert r.status_code == 422


def test_signup_short_username_rejected(client):
    r = client.post("/api/signup", json=_signup_payload(username="ab"))
    assert r.status_code == 422


def test_signup_missing_email_rejected(client):
    payload = _signup_payload()
    del payload["email"]
    r = client.post("/api/signup", json=payload)
    assert r.status_code == 422


def test_signup_phone_conflict_does_not_leave_an_orphaned_patient(client, db_session, admin_user):
    """Regression test for the bug found in production: a brand-new email
    with a phone number colliding with an unrelated account used to create
    a patient record and THEN fail, leaving the patient permanently
    orphaned with no login attached."""
    before = db_session.query(Patient).count()

    r = client.post("/api/signup", json=_signup_payload(
        email="totally_new_email@example.com", phone=admin_user.phone,
    ))
    assert r.status_code == 409

    after = db_session.query(Patient).count()
    assert after == before, "signup must not create a patient record when it ultimately fails"


def test_signup_only_ever_creates_patient_role(client, db_session):
    r = client.post("/api/signup", json=_signup_payload())
    assert r.status_code == 201
    user = db_session.query(User).filter(User.username == "newpatient1").first()
    assert user.role == "Patient"
