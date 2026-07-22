from tests.contracts import get_json


def test_login_authentication_contract():
    response, payload = get_json('/api/ping')
    assert response.status_code == 200
    assert payload['ok'] is True
