from datetime import date, time
from app.models.appointment import Appointment


def test_dashboard_summary_counts_match_seeded_data(client, db_session, admin_headers, patient_record, doctor_record):
    db_session.add_all([
        Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                    appointment_date=date.today(), appointment_time=time(9, 0, 0), status="Scheduled"),
        Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                    appointment_date=date.today(), appointment_time=time(10, 0, 0), status="Completed"),
    ])
    db_session.commit()

    r = client.get("/api/dashboard/", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total_doctors"] == 1
    assert body["total_patients"] == 1
    assert body["total_appointments"] == 2
    assert body["scheduled_appointments"] == 1
    assert body["completed_appointments"] == 1


def test_dashboard_today_only_counts_todays_appointments(client, db_session, admin_headers, patient_record, doctor_record):
    from datetime import timedelta
    db_session.add_all([
        Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                    appointment_date=date.today(), appointment_time=time(9, 0, 0), status="Scheduled"),
        Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                    appointment_date=date.today() + timedelta(days=5), appointment_time=time(9, 0, 0), status="Scheduled"),
    ])
    db_session.commit()

    r = client.get("/api/dashboard/today", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["appointments_today"] == 1


def test_daily_report_counts_by_status(client, db_session, admin_headers, patient_record, doctor_record):
    db_session.add_all([
        Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                    appointment_date=date.today(), appointment_time=time(9, 0, 0), status="Scheduled"),
        Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                    appointment_date=date.today(), appointment_time=time(10, 0, 0), status="Completed"),
        Appointment(patient_id=patient_record.patient_id, doctor_id=doctor_record.doctor_id,
                    appointment_date=date.today(), appointment_time=time(11, 0, 0), status="Completed"),
    ])
    db_session.commit()

    r = client.get("/api/reports/daily", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total_appointments"] == 3
    assert body["scheduled"] == 1
    assert body["completed"] == 2


def test_doctor_report_lists_only_active_doctors(client, db_session, admin_headers, doctor_record):
    from app.models.doctor import Doctor
    inactive_doc = Doctor(doctor_name="Dr. Retired", specialization="None", is_active=False)
    db_session.add(inactive_doc)
    db_session.commit()

    r = client.get("/api/reports/doctors", headers=admin_headers)
    assert r.status_code == 200
    names = [d["doctor_name"] for d in r.json()["report"]]
    assert doctor_record.doctor_name in names
    assert "Dr. Retired" not in names
