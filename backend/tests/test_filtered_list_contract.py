from tests.contracts import get_json


def test_filtered_list_contract():
    response, payload = get_json('/api/version')
    assert response.status_code == 200
    assert payload['version'] == 'starter-v1'
