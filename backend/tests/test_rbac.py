from datetime import date, time
import pytest


def _all_role_headers(admin_headers, receptionist_headers, doctor_headers, patient_headers):
    return {
        "Admin": admin_headers,
        "Receptionist": receptionist_headers,
        "Doctor": doctor_headers,
        "Patient": patient_headers,
    }


# ---- No token at all ---------------------------------------------------

@pytest.mark.parametrize("method,path", [
    ("get", "/api/doctors/"),
    ("get", "/api/patients/"),
    ("get", "/api/appointments/"),
    ("get", "/api/users/"),
    ("get", "/api/audit-logs/"),
    ("get", "/api/dashboard/"),
    ("get", "/api/reports/daily"),
    ("get", "/api/profile"),
])
def test_protected_endpoints_reject_missing_token(client, method, path):
    r = getattr(client, method)(path)
    assert r.status_code == 401


# ---- Doctors: everyone can read, only Admin can write -------------------

def test_any_authenticated_role_can_list_doctors(client, doctor_record, admin_headers, receptionist_headers, doctor_headers, patient_headers):
    for role, headers in _all_role_headers(admin_headers, receptionist_headers, doctor_headers, patient_headers).items():
        r = client.get("/api/doctors/", headers=headers)
        assert r.status_code == 200, f"{role} should be able to list doctors"


@pytest.mark.parametrize("role_fixture", ["receptionist_headers", "doctor_headers", "patient_headers"])
def test_only_admin_can_create_doctor(client, request, role_fixture):
    headers = request.getfixturevalue(role_fixture)
    r = client.post("/api/doctors/", json={
        "doctor_name": "Dr. Nope", "specialization": "Nope", "phone": "9", "email": "nope@example.com",
    }, headers=headers)
    assert r.status_code == 403


def test_admin_can_create_doctor(client, admin_headers):
    r = client.post("/api/doctors/", json={
        "doctor_name": "Dr. New", "specialization": "Dermatology", "phone": "3000000001", "email": "drnew@example.com",
    }, headers=admin_headers)
    assert r.status_code == 200


# ---- Patients: only Admin/Receptionist can list; patients see only themselves --

@pytest.mark.parametrize("role_fixture", ["doctor_headers", "patient_headers"])
def test_doctor_and_patient_cannot_list_all_patients(client, request, role_fixture):
    headers = request.getfixturevalue(role_fixture)
    r = client.get("/api/patients/", headers=headers)
    assert r.status_code == 403


def test_admin_and_receptionist_can_list_patients(client, admin_headers, receptionist_headers):
    for headers in (admin_headers, receptionist_headers):
        r = client.get("/api/patients/", headers=headers)
        assert r.status_code == 200


def test_patient_can_view_own_record(client, patient_headers, patient_record):
    r = client.get(f"/api/patients/{patient_record.patient_id}", headers=patient_headers)
    assert r.status_code == 200


def test_patient_cannot_view_someone_elses_record(client, db_session, patient_headers):
    from app.models.patient import Patient
    other = Patient(patient_name="Someone Else", phone="4000000009", email="someone@example.com")
    db_session.add(other)
    db_session.commit()
    db_session.refresh(other)

    r = client.get(f"/api/patients/{other.patient_id}", headers=patient_headers)
    assert r.status_code == 403


@pytest.mark.parametrize("role_fixture", ["doctor_headers", "patient_headers"])
def test_doctor_and_patient_cannot_create_patient_record(client, request, role_fixture):
    headers = request.getfixturevalue(role_fixture)
    r = client.post("/api/patients/", json={"patient_name": "Nope"}, headers=headers)
    assert r.status_code == 403


# ---- Appointments: scoping per role -------------------------------------

def test_doctor_only_sees_own_appointments(client, db_session, doctor_headers, doctor_record, patient_record):
    from app.models.doctor import Doctor
    from app.models.appointment import Appointment
    other_doc = Doctor(doctor_name="Dr. Other", specialization="ENT", phone="5000000001", email="other@example.com")
    db_session.add(other_doc)
    db_session.commit()
    db_session.refresh(other_doc)

    mine = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                        appointment_date=date(2026, 9, 1), appointment_time=time(10, 0, 0))
    not_mine = Appointment(patient_id=patient_record.patient_id, doctor_id=other_doc.doctor_id,
                            appointment_date=date(2026, 9, 1), appointment_time=time(11, 0, 0))
    db_session.add_all([mine, not_mine])
    db_session.commit()

    r = client.get("/api/appointments/", headers=doctor_headers)
    assert r.status_code == 200
    doctor_ids_seen = {a["doctor_id"] for a in r.json()}
    assert doctor_ids_seen == {doctor_record.doctor_id}


def test_patient_only_sees_own_appointments(client, db_session, patient_headers, patient_record, doctor_record):
    from app.models.patient import Patient
    from app.models.appointment import Appointment
    other_patient = Patient(patient_name="Other Patient", phone="6000000001", email="otherpat@example.com")
    db_session.add(other_patient)
    db_session.commit()
    db_session.refresh(other_patient)

    mine = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                        appointment_date=date(2026, 9, 1), appointment_time=time(10, 0, 0))
    not_mine = Appointment(patient_id=other_patient.patient_id, doctor_id=doctor_record.doctor_id,
                            appointment_date=date(2026, 9, 1), appointment_time=time(11, 0, 0))
    db_session.add_all([mine, not_mine])
    db_session.commit()

    r = client.get("/api/appointments/", headers=patient_headers)
    assert r.status_code == 200
    patient_ids_seen = {a["patient_id"] for a in r.json()}
    assert patient_ids_seen == {patient_record.patient_id}


@pytest.mark.parametrize("role_fixture", ["doctor_headers", "patient_headers"])
def test_only_admin_and_receptionist_can_book_appointments(client, request, role_fixture, patient_record, doctor_record):
    headers = request.getfixturevalue(role_fixture)
    r = client.post("/api/appointments/", json={
        "patient_id": patient_record.patient_id, "doctor_id": doctor_record.doctor_id,
        "appointment_date": "2026-09-01", "appointment_time": "10:00:00",
    }, headers=headers)
    assert r.status_code == 403


def test_doctor_cannot_reassign_appointment_to_a_different_doctor(client, db_session, doctor_headers, doctor_record, patient_record):
    from app.models.doctor import Doctor
    from app.models.appointment import Appointment
    other_doc = Doctor(doctor_name="Dr. Other", specialization="ENT", phone="5000000002", email="other2@example.com")
    db_session.add(other_doc)
    appt = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                        appointment_date=date(2026, 9, 1), appointment_time=time(10, 0, 0), status="Scheduled")
    db_session.add(appt)
    db_session.commit()
    db_session.refresh(appt)
    db_session.refresh(other_doc)

    r = client.put(f"/api/appointments/{appt.appointment_id}", json={
        "patient_id": patient_record.patient_id, "doctor_id": other_doc.doctor_id,
        "appointment_date": "2026-09-01", "appointment_time": "10:00:00", "status": "Scheduled",
    }, headers=doctor_headers)
    assert r.status_code == 403


def test_doctor_can_update_status_of_own_appointment(client, db_session, doctor_headers, doctor_record, patient_record):
    from app.models.appointment import Appointment
    appt = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                        appointment_date=date(2026, 9, 1), appointment_time=time(10, 0, 0), status="Scheduled")
    db_session.add(appt)
    db_session.commit()
    db_session.refresh(appt)

    r = client.put(f"/api/appointments/{appt.appointment_id}", json={
        "patient_id": patient_record.patient_id, "doctor_id": doctor_record.doctor_id,
        "appointment_date": "2026-09-01", "appointment_time": "10:00:00", "status": "Completed",
        "remarks": "All good",
    }, headers=doctor_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "Completed"


def test_patient_can_cancel_own_scheduled_appointment(client, db_session, patient_headers, patient_record, doctor_record):
    from app.models.appointment import Appointment
    appt = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                        appointment_date=date(2026, 9, 1), appointment_time=time(10, 0, 0), status="Scheduled")
    db_session.add(appt)
    db_session.commit()
    db_session.refresh(appt)

    r = client.delete(f"/api/appointments/{appt.appointment_id}", headers=patient_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "Cancelled"


def test_patient_cannot_cancel_someone_elses_appointment(client, db_session, patient_headers, doctor_record):
    from app.models.patient import Patient
    from app.models.appointment import Appointment
    other_patient = Patient(patient_name="Other Patient", phone="6000000002", email="otherpat2@example.com")
    db_session.add(other_patient)
    db_session.commit()
    db_session.refresh(other_patient)

    appt = Appointment(patient_id=other_patient.patient_id, doctor_id=doctor_record.doctor_id,
                        appointment_date=date(2026, 9, 1), appointment_time=time(10, 0, 0), status="Scheduled")
    db_session.add(appt)
    db_session.commit()
    db_session.refresh(appt)

    r = client.delete(f"/api/appointments/{appt.appointment_id}", headers=patient_headers)
    assert r.status_code == 403


def test_patient_cannot_cancel_a_completed_appointment(client, db_session, patient_headers, patient_record, doctor_record):
    from app.models.appointment import Appointment
    appt = Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                        appointment_date=date(2026, 9, 1), appointment_time=time(10, 0, 0), status="Completed")
    db_session.add(appt)
    db_session.commit()
    db_session.refresh(appt)

    r = client.delete(f"/api/appointments/{appt.appointment_id}", headers=patient_headers)
    assert r.status_code == 400


# ---- Admin-only surfaces: Users, Audit Log, Reports ----------------------

@pytest.mark.parametrize("role_fixture", ["receptionist_headers", "doctor_headers", "patient_headers"])
def test_only_admin_can_access_users_page(client, request, role_fixture):
    headers = request.getfixturevalue(role_fixture)
    r = client.get("/api/users/", headers=headers)
    assert r.status_code == 403


@pytest.mark.parametrize("role_fixture", ["receptionist_headers", "doctor_headers", "patient_headers"])
def test_only_admin_can_access_audit_log(client, request, role_fixture):
    headers = request.getfixturevalue(role_fixture)
    r = client.get("/api/audit-logs/", headers=headers)
    assert r.status_code == 403


@pytest.mark.parametrize("role_fixture", ["receptionist_headers", "doctor_headers", "patient_headers"])
def test_only_admin_can_access_reports(client, request, role_fixture):
    headers = request.getfixturevalue(role_fixture)
    for path in ("/api/reports/daily", "/api/reports/doctors", "/api/reports/patients"):
        r = client.get(path, headers=headers)
        assert r.status_code == 403, f"{path} should be Admin-only"


@pytest.mark.parametrize("role_fixture", ["doctor_headers", "patient_headers"])
def test_only_admin_and_receptionist_can_access_dashboard(client, request, role_fixture):
    headers = request.getfixturevalue(role_fixture)
    r = client.get("/api/dashboard/", headers=headers)
    assert r.status_code == 403
