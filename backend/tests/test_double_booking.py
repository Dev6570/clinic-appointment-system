from datetime import date, time
from app.models.doctor import Doctor


def test_same_doctor_cannot_be_double_booked(client, admin_headers, patient_record, doctor_record):
    payload_base = {
        "doctor_id": doctor_record.doctor_id,
        "appointment_date": "2026-09-01",
        "appointment_time": "10:00:00",
        "patient_id": patient_record.patient_id,
    }
    r1 = client.post("/api/appointments/", json=payload_base, headers=admin_headers)
    assert r1.status_code == 200

    r2 = client.post("/api/appointments/", json=payload_base, headers=admin_headers)
    assert r2.status_code == 409
    assert "already booked" in r2.json()["detail"].lower()


def test_cancelling_frees_up_the_slot_for_rebooking(client, admin_headers, patient_record, doctor_record):
    payload_base = {
        "doctor_id": doctor_record.doctor_id,
        "appointment_date": "2026-09-01",
        "appointment_time": "11:00:00",
        "patient_id": patient_record.patient_id,
    }
    r1 = client.post("/api/appointments/", json=payload_base, headers=admin_headers)
    appointment_id = r1.json()["appointment_id"]

    client.delete(f"/api/appointments/{appointment_id}", headers=admin_headers)

    r2 = client.post("/api/appointments/", json=payload_base, headers=admin_headers)
    assert r2.status_code == 200, "a cancelled slot should be rebookable, not permanently blocked"


def test_different_doctors_can_share_the_same_slot(client, db_session, admin_headers, patient_record, doctor_record):
    other_doc = Doctor(doctor_name="Dr. Other", specialization="ENT", phone="7000000001", email="other@example.com")
    db_session.add(other_doc)
    db_session.commit()
    db_session.refresh(other_doc)

    shared_slot = {"appointment_date": "2026-09-01", "appointment_time": "12:00:00", "patient_id": patient_record.patient_id}
    r1 = client.post("/api/appointments/", json={**shared_slot, "doctor_id": doctor_record.doctor_id}, headers=admin_headers)
    r2 = client.post("/api/appointments/", json={**shared_slot, "doctor_id": other_doc.doctor_id}, headers=admin_headers)
    assert r1.status_code == 200
    assert r2.status_code == 200
