def test_admin_can_create_receptionist_account(client, admin_headers):
    r = client.post("/api/users/", json={
        "username": "newdesk", "password": "DeskPass1", "full_name": "New Desk",
        "role": "Receptionist", "email": "newdesk@example.com", "phone": "5100000001",
    }, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["role"] == "Receptionist"


def test_doctor_account_requires_a_linked_doctor_record(client, admin_headers):
    r = client.post("/api/users/", json={
        "username": "nodoctorlink", "password": "DocPass1", "full_name": "No Link",
        "role": "Doctor",
    }, headers=admin_headers)
    assert r.status_code == 422


def test_patient_account_requires_a_linked_patient_record(client, admin_headers):
    r = client.post("/api/users/", json={
        "username": "nopatientlink", "password": "PatPass1", "full_name": "No Link",
        "role": "Patient",
    }, headers=admin_headers)
    assert r.status_code == 422


def test_creating_doctor_account_ignores_submitted_contact_info_and_uses_linked_record(client, admin_headers, doctor_record):
    r = client.post("/api/users/", json={
        "username": "drnewlink", "password": "DocPass1", "full_name": "Dr New Link",
        "role": "Doctor", "doctor_id": doctor_record.doctor_id,
        # Deliberately different from the doctor record's actual contact info -
        # this should be ignored in favor of what's on the doctor record.
        "email": "should_be_ignored@example.com", "phone": "0000000000",
    }, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["email"] == doctor_record.email
    assert r.json()["phone"] == doctor_record.phone


def test_admin_cannot_deactivate_own_account(client, admin_headers, admin_user):
    r = client.put(f"/api/users/{admin_user.user_id}", json={"is_active": False}, headers=admin_headers)
    assert r.status_code == 400


def test_admin_cannot_change_own_role(client, admin_headers, admin_user):
    r = client.put(f"/api/users/{admin_user.user_id}", json={"role": "Receptionist"}, headers=admin_headers)
    assert r.status_code == 400


def test_admin_cannot_deactivate_own_account_via_delete_endpoint(client, admin_headers, admin_user):
    r = client.delete(f"/api/users/{admin_user.user_id}", headers=admin_headers)
    assert r.status_code == 400


def test_admin_can_deactivate_another_account(client, admin_headers, receptionist_user):
    r = client.delete(f"/api/users/{receptionist_user.user_id}", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["is_active"] is False


def test_deactivated_account_cannot_log_in(client, admin_headers, receptionist_user):
    client.delete(f"/api/users/{receptionist_user.user_id}", headers=admin_headers)
    r = client.post("/api/login", data={"username": receptionist_user.username, "password": "DeskPass1"})
    assert r.status_code == 403
