from tests.contracts import get_json


def test_ticket_crud_contract():
    response, payload = get_json('/api/ping')
    assert response.status_code == 200
    assert payload['message'] == 'pong'
