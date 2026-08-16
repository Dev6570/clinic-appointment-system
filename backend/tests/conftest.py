"""
Shared fixtures for the whole test suite.

Each test gets a fresh in-memory SQLite database (StaticPool keeps it as a
single shared connection so both the test code and the app see the same
data) and a TestClient wired to that database instead of your real Render
Postgres. Nothing here ever touches your live database.

The login rate limiter is disabled by default in the `client` fixture,
since a full test run makes far more than 20 login calls and would
otherwise trip on itself rather than on anything meaningful. The one test
that actually verifies the rate limiter (test_auth_login.py) re-enables it
deliberately.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.rate_limit import enforce_login_rate_limit
from app.models.user import User
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.auth_utils import hash_password

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture()
def engine():
    eng = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture()
def db_session(engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[enforce_login_rate_limit] = lambda: None
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def client_with_real_rate_limit(db_session):
    """Same as `client`, but the real login rate limiter is left active.
    Only used by the test that specifically verifies rate limiting."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---- Seed helpers -----------------------------------------------------
# These write directly to the DB rather than through the API, so fixtures
# for "a logged-in Admin" don't depend on the signup/create-user endpoints
# actually working - each endpoint's own tests are what verify those.

def _make_user(db_session, username, password, role, **kwargs):
    user = User(
        username=username,
        password_hash=hash_password(password),
        full_name=kwargs.pop("full_name", username.title()),
        role=role,
        is_active=True,
        **kwargs,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _login(client, username, password):
    r = client.post("/api/login", data={"username": username, "password": password})
    assert r.status_code == 200, f"seed login failed for {username}: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture()
def admin_user(db_session):
    return _make_user(db_session, "admin1", "AdminPass1", "Admin", email="admin1@example.com", phone="1000000001")


@pytest.fixture()
def admin_token(client, admin_user):
    return _login(client, "admin1", "AdminPass1")


@pytest.fixture()
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def receptionist_user(db_session):
    return _make_user(db_session, "frontdesk1", "DeskPass1", "Receptionist", email="frontdesk1@example.com", phone="1000000002")


@pytest.fixture()
def receptionist_token(client, receptionist_user):
    return _login(client, "frontdesk1", "DeskPass1")


@pytest.fixture()
def receptionist_headers(receptionist_token):
    return {"Authorization": f"Bearer {receptionist_token}"}


@pytest.fixture()
def doctor_record(db_session):
    doc = Doctor(doctor_name="Dr. Iris Chen", specialization="Pediatrics", phone="1000000003", email="ichen@example.com")
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    return doc


@pytest.fixture()
def doctor_user(db_session, doctor_record):
    return _make_user(
        db_session, "drchen", "DocPass1", "Doctor",
        email=doctor_record.email, phone=doctor_record.phone, doctor_id=doctor_record.doctor_id,
        full_name="Dr. Iris Chen",
    )


@pytest.fixture()
def doctor_token(client, doctor_user):
    return _login(client, "drchen", "DocPass1")


@pytest.fixture()
def doctor_headers(doctor_token):
    return {"Authorization": f"Bearer {doctor_token}"}


@pytest.fixture()
def patient_record(db_session):
    pat = Patient(patient_name="Alex Rivera", age=31, gender="Other", phone="1000000004", email="arivera@example.com")
    db_session.add(pat)
    db_session.commit()
    db_session.refresh(pat)
    return pat


@pytest.fixture()
def patient_user(db_session, patient_record):
    return _make_user(
        db_session, "arivera", "PatPass1", "Patient",
        email=patient_record.email, phone=patient_record.phone, patient_id=patient_record.patient_id,
        full_name="Alex Rivera",
    )


@pytest.fixture()
def patient_token(client, patient_user):
    return _login(client, "arivera", "PatPass1")


@pytest.fixture()
def patient_headers(patient_token):
    return {"Authorization": f"Bearer {patient_token}"}
