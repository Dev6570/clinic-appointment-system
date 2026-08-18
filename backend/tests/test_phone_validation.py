import pytest


@pytest.mark.parametrize("bad_phone", ["12345", "123456789", "12345678901", "98765abcde", "987-654-3210", "0"])
def test_signup_rejects_invalid_phone_formats(client, bad_phone):
    r = client.post("/api/signup", json={
        "username": "phonetest1", "password": "Passw0rd1", "full_name": "Phone Test",
        "email": "phonetest1@example.com", "phone": bad_phone,
    })
    assert r.status_code == 422


def test_signup_accepts_exactly_10_digit_phone(client):
    r = client.post("/api/signup", json={
        "username": "phonetest2", "password": "Passw0rd1", "full_name": "Phone Test",
        "email": "phonetest2@example.com", "phone": "9876543210",
    })
    assert r.status_code == 201


def test_signup_allows_omitting_phone_entirely(client):
    r = client.post("/api/signup", json={
        "username": "phonetest3", "password": "Passw0rd1", "full_name": "Phone Test",
        "email": "phonetest3@example.com",
    })
    assert r.status_code == 201


def test_patient_create_rejects_invalid_phone(client, admin_headers):
    r = client.post("/api/patients/", json={"patient_name": "Bad Phone Patient", "phone": "123"}, headers=admin_headers)
    assert r.status_code == 422


def test_patient_create_accepts_valid_phone(client, admin_headers):
    r = client.post("/api/patients/", json={"patient_name": "Good Phone Patient", "phone": "9123456780"}, headers=admin_headers)
    assert r.status_code == 200


def test_doctor_create_rejects_invalid_phone(client, admin_headers):
    r = client.post("/api/doctors/", json={
        "doctor_name": "Dr. Bad Phone", "specialization": "General", "phone": "55555",
    }, headers=admin_headers)
    assert r.status_code == 422


def test_doctor_create_accepts_valid_phone(client, admin_headers):
    r = client.post("/api/doctors/", json={
        "doctor_name": "Dr. Good Phone", "specialization": "General", "phone": "9123456781",
    }, headers=admin_headers)
    assert r.status_code == 200


def test_admin_create_user_rejects_invalid_phone(client, admin_headers):
    r = client.post("/api/users/", json={
        "username": "badphoneuser", "password": "Passw0rd1", "full_name": "Bad Phone",
        "role": "Receptionist", "phone": "42",
    }, headers=admin_headers)
    assert r.status_code == 422


def test_admin_update_user_rejects_invalid_phone(client, admin_headers, receptionist_user):
    r = client.put(f"/api/users/{receptionist_user.user_id}", json={"phone": "notanumber"}, headers=admin_headers)
    assert r.status_code == 422


def test_admin_update_patient_rejects_invalid_phone_via_sync_path(client, admin_headers, patient_record):
    """The PUT endpoint itself should reject a malformed phone before it
    ever gets near the contact-sync logic added earlier."""
    r = client.put(f"/api/patients/{patient_record.patient_id}", json={
        "patient_name": patient_record.patient_name, "phone": "99",
    }, headers=admin_headers)
    assert r.status_code == 422
