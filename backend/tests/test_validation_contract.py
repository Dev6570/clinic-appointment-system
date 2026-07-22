from fastapi.testclient import TestClient

from app.main import app


def test_validation_contract():
    client = TestClient(app)
    response = client.get('/api/unknown')
    assert response.status_code == 404
