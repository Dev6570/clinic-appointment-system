from tests.contracts import get_json


def test_audit_trail_contract():
    response, payload = get_json('/health')
    assert response.status_code == 200
    assert payload['service'] == 'api'
