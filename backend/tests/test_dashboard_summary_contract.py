from tests.contracts import get_json


def test_dashboard_summary_contract():
    response, payload = get_json('/api/version')
    assert response.status_code == 200
    assert payload['deploy_target'] == 'render'
