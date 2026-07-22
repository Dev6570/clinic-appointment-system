from tests.contracts import get_json


def test_comments_activity_contract():
    response, payload = get_json('/api/ping')
    assert response.status_code == 200
    assert payload == {'ok': True, 'message': 'pong'}
