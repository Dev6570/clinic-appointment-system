from fastapi.testclient import TestClient

from app.main import app


def get_json(path: str):
    with TestClient(app) as client:
        response = client.get(path)
        return response, response.json()
