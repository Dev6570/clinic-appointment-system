from tests.contracts import get_json


def test_assignment_contract():
    response, payload = get_json('/health')
    assert response.status_code == 200
    assert payload['stack'] == 'python'
