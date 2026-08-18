from app.models.user import User


def test_admin_update_doctor_syncs_linked_account_contact_info(client, db_session, admin_headers, doctor_record, doctor_user):
    r = client.put(f"/api/doctors/{doctor_record.doctor_id}", json={
        "doctor_name": doctor_record.doctor_name, "specialization": doctor_record.specialization,
        "phone": "3100000001", "email": doctor_record.email,
    }, headers=admin_headers)
    assert r.status_code == 200

    db_session.refresh(doctor_user)
    assert doctor_user.phone == "3100000001"


def test_doctor_contact_sync_skipped_on_conflict_but_edit_still_succeeds(client, db_session, admin_headers, doctor_record, doctor_user):
    conflicting = User(username="taken_phone_holder", password_hash="x", full_name="Someone",
                        role="Receptionist", phone="3200000001", email="taken@example.com", is_active=True)
    db_session.add(conflicting)
    db_session.commit()

    r = client.put(f"/api/doctors/{doctor_record.doctor_id}", json={
        "doctor_name": doctor_record.doctor_name, "specialization": doctor_record.specialization,
        "phone": "3200000001", "email": doctor_record.email,
    }, headers=admin_headers)
    # The doctor record edit itself should still succeed...
    assert r.status_code == 200
    assert r.json()["phone"] == "3200000001"

    # ...but the linked login should NOT have been overwritten with a phone
    # that collides with a different account.
    db_session.refresh(doctor_user)
    assert doctor_user.phone != "3200000001"


def test_doctor_update_with_no_linked_account_does_not_error(client, admin_headers, doctor_record):
    """doctor_record with no doctor_user fixture - nothing should blow up
    when there's no login to sync."""
    r = client.put(f"/api/doctors/{doctor_record.doctor_id}", json={
        "doctor_name": doctor_record.doctor_name, "specialization": "Updated Specialty",
        "phone": doctor_record.phone, "email": doctor_record.email,
    }, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["specialization"] == "Updated Specialty"


def test_delete_doctor_is_a_soft_delete(client, db_session, admin_headers, doctor_record):
    r = client.delete(f"/api/doctors/{doctor_record.doctor_id}", headers=admin_headers)
    assert r.status_code == 200

    db_session.refresh(doctor_record)
    assert doctor_record.is_active is False

    # Soft-deleted doctors should no longer show up in the active list
    r = client.get("/api/doctors/", headers=admin_headers)
    ids = [d["doctor_id"] for d in r.json()]
    assert doctor_record.doctor_id not in ids


def test_update_nonexistent_doctor_returns_404(client, admin_headers):
    r = client.put("/api/doctors/999999", json={
        "doctor_name": "Ghost", "specialization": "None", "phone": "9000000000", "email": "ghost@example.com",
    }, headers=admin_headers)
    assert r.status_code == 404
