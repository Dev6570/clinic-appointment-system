from tests.contracts import get_json


def test_pagination_contract():
    response, payload = get_json('/api/version')
    assert response.status_code == 200
    assert sorted(payload.keys()) == ['deploy_target', 'runtime', 'version']
