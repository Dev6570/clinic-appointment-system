from app.models.user import User


def test_admin_update_patient_syncs_linked_account_contact_info(client, db_session, admin_headers, patient_record, patient_user):
    r = client.put(f"/api/patients/{patient_record.patient_id}", json={
        "patient_name": patient_record.patient_name, "phone": "4100000001", "email": patient_record.email,
    }, headers=admin_headers)
    assert r.status_code == 200

    db_session.refresh(patient_user)
    assert patient_user.phone == "4100000001"


def test_receptionist_update_patient_also_syncs_linked_account(client, db_session, receptionist_headers, patient_record, patient_user):
    r = client.put(f"/api/patients/{patient_record.patient_id}", json={
        "patient_name": patient_record.patient_name, "phone": "4100000002", "email": patient_record.email,
    }, headers=receptionist_headers)
    assert r.status_code == 200

    db_session.refresh(patient_user)
    assert patient_user.phone == "4100000002"


def test_patient_contact_sync_skipped_on_conflict_but_edit_still_succeeds(client, db_session, admin_headers, patient_record, patient_user):
    conflicting = User(username="taken_phone_holder2", password_hash="x", full_name="Someone",
                        role="Receptionist", phone="4200000001", email="taken2@example.com", is_active=True)
    db_session.add(conflicting)
    db_session.commit()

    r = client.put(f"/api/patients/{patient_record.patient_id}", json={
        "patient_name": patient_record.patient_name, "phone": "4200000001", "email": patient_record.email,
    }, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["phone"] == "4200000001"

    db_session.refresh(patient_user)
    assert patient_user.phone != "4200000001"


def test_delete_patient_is_a_soft_delete(client, db_session, admin_headers, patient_record):
    r = client.delete(f"/api/patients/{patient_record.patient_id}", headers=admin_headers)
    assert r.status_code == 200

    db_session.refresh(patient_record)
    assert patient_record.is_active is False


def test_update_nonexistent_patient_returns_404(client, admin_headers):
    r = client.put("/api/patients/999999", json={"patient_name": "Ghost"}, headers=admin_headers)
    assert r.status_code == 404
