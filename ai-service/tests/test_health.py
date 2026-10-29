from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "nexus-ai-service"
    assert "engines" in data
    assert data["engines"]["resource_recommender"] == "operational"
    assert data["engines"]["utilization_analyzer"] == "operational"
    assert data["engines"]["demand_forecaster"] == "operational"


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["docs"] == "/docs"
    assert len(data["endpoints"]) == 4

