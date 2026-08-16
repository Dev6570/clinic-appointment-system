def test_login_success_returns_token(client, admin_user):
    r = client.post("/api/login", data={"username": "admin1", "password": "AdminPass1"})
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert r.json()["token_type"] == "bearer"


def test_login_wrong_password_is_generic_401(client, admin_user):
    r = client.post("/api/login", data={"username": "admin1", "password": "WrongPassword1"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Incorrect username or password"


def test_login_nonexistent_user_same_generic_message(client):
    # Deliberately identical to the wrong-password message above - the
    # response shouldn't let someone tell whether a username exists.
    r = client.post("/api/login", data={"username": "nobody_here", "password": "Whatever1"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Incorrect username or password"


def test_login_deactivated_account_is_forbidden(client, db_session, admin_user):
    from app.models.user import User
    admin_user.is_active = False
    db_session.commit()

    r = client.post("/api/login", data={"username": "admin1", "password": "AdminPass1"})
    assert r.status_code == 403
    assert "deactivated" in r.json()["detail"].lower()


def test_account_locks_after_five_failed_attempts(client, admin_user):
    for _ in range(5):
        r = client.post("/api/login", data={"username": "admin1", "password": "WrongPassword1"})
        assert r.status_code == 401  # not locked yet on any of these

    # The 6th attempt (even with the correct password) should now be locked
    r = client.post("/api/login", data={"username": "admin1", "password": "AdminPass1"})
    assert r.status_code == 423
    assert "locked" in r.json()["detail"].lower()


def test_successful_login_resets_failed_attempt_counter(client, db_session, admin_user):
    for _ in range(3):
        client.post("/api/login", data={"username": "admin1", "password": "WrongPassword1"})

    r = client.post("/api/login", data={"username": "admin1", "password": "AdminPass1"})
    assert r.status_code == 200

    db_session.refresh(admin_user)
    assert admin_user.failed_login_attempts == 0
    assert admin_user.locked_until is None


def test_login_rate_limit_blocks_after_20_requests_from_same_client(client_with_real_rate_limit):
    client = client_with_real_rate_limit
    # 20 distinct, harmless attempts (different nonexistent usernames, so
    # none of them trip the per-account lockout) should all be let through
    # by the rate limiter itself.
    for i in range(20):
        r = client.post("/api/login", data={"username": f"nouser{i}", "password": "whatever"})
        assert r.status_code == 401, f"attempt {i} unexpectedly blocked early"

    # The 21st request from the same client within the window should be
    # rate-limited, regardless of the credentials used.
    r = client.post("/api/login", data={"username": "nouser_final", "password": "whatever"})
    assert r.status_code == 429
