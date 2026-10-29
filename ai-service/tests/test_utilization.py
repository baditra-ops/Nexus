from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_utilization_demo_mode_insights():
    """Verify underutilized detection, bottleneck detection, and peak pattern reporting in demo mode."""
    payload = {
        "time_window_days": 30,
        "underutilized_threshold": 0.20,
        "overutilized_threshold": 0.75,
        "demo_mode": True,
    }

    response = client.post("/utilization-insights", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["is_demo_data"] is True
    assert data["data_limitation_warning"] is not None
    assert data["total_resources_evaluated"] >= 8

    # Underutilized resources detection
    assert data["underutilized_resources_count"] > 0
    underutilized = data["underutilized_resources"]
    for res in underutilized:
        assert res["utilization_rate"] < 0.20
        assert res["status_classification"] == "underutilized"
        assert "Underutilized" in res["actionable_recommendation"]

    # Bottleneck detection
    assert data["bottleneck_resources_count"] > 0
    bottlenecks = data["high_demand_resources"]
    for res in bottlenecks:
        assert res["status_classification"] == "high_demand_bottleneck"
        assert "bottleneck" in res["actionable_recommendation"].lower()

    # Peak demand pattern checks
    patterns = data["peak_demand_patterns"]
    assert patterns["busiest_day_of_week"] in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    assert ":" in patterns["busiest_time_slot"]

    # Category summaries check
    assert len(data["category_summaries"]) > 0


def test_utilization_insufficient_data_rejection():
    """Verify that when historical data is insufficient and demo_mode=False, service rejects with predictable 422 error."""
    payload = {
        "time_window_days": 30,
        "bookings": [
            # Only 1 booking provided (minimum is 5)
            {
                "id": "b0000000-0000-0000-0000-000000000001",
                "resource_id": "r0000000-0000-0000-0000-000000000001",
                "borrower_id": "u0000000-0000-0000-0000-000000000001",
                "start_time": "2026-10-20T10:00:00Z",
                "end_time": "2026-10-20T14:00:00Z",
                "status": "completed",
            }
        ],
        "demo_mode": False,
    }

    response = client.post("/utilization-insights", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert "Insufficient historical booking data" in data["error"]
    assert data["details"]["error_type"] == "INSUFFICIENT_DATA"
    assert data["details"]["required_records"] == 5
    assert data["details"]["available_records"] == 1


def test_utilization_category_filter():
    """Verify filtering utilization metrics to a specific category."""
    payload = {
        "time_window_days": 30,
        "category": "Optics & Imaging",
        "demo_mode": True,
    }

    response = client.post("/utilization-insights", json=payload)
    assert response.status_code == 200
    data = response.json()
    for metric in data["all_resource_metrics"]:
        assert metric["category"] == "Optics & Imaging"

