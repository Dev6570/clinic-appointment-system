from fastapi.testclient import TestClient
from app.main import app


def test_version_endpoint_exposes_python_runtime():
    client = TestClient(app)
    resp = client.get('/api/version')
    assert resp.status_code == 200
    assert resp.json()['runtime'] == 'python'
