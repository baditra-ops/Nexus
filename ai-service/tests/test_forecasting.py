from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_demand_forecast_demo_mode():
    """Verify forecasting with ML Ridge regression vs moving average baseline in demo mode."""
    payload = {
        "forecast_target": "category",
        "target_identifier": "Fabrication & CNC",
        "forecast_horizon_days": 14,
        "demo_mode": True,
    }

    response = client.post("/demand-forecast", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["is_demo_data"] is True
    assert data["forecast_horizon_days"] == 14
    assert len(data["daily_forecasts"]) == 14

    # Baseline vs ML model metrics
    baseline = data["baseline_model_metrics"]
    ml = data["ml_model_metrics"]

    assert baseline["algorithm_type"] == "baseline_moving_average"
    assert baseline["mean_absolute_error_hours"] >= 0.0
    assert baseline["root_mean_squared_error_hours"] >= 0.0

    assert ml["algorithm_type"] == "ml_ridge_regression"
    assert ml["mean_absolute_error_hours"] >= 0.0
    assert ml["root_mean_squared_error_hours"] >= 0.0

    # Model comparison explanation
    assert "Ridge" in data["model_comparison_summary"]
    assert "baseline" in data["model_comparison_summary"].lower()

    # Daily projection checks
    first_day = data["daily_forecasts"][0]
    assert "date" in first_day
    assert "day_of_week" in first_day
    assert first_day["predicted_booked_hours"] >= 0.0
    assert first_day["confidence_lower_hours"] <= first_day["confidence_upper_hours"]

    # Assumptions and limitations check
    assert len(data["assumptions_and_limitations"]) >= 3


def test_demand_forecast_insufficient_data_rejection():
    """Verify that when historical data is insufficient and demo_mode=False, 422 error is returned."""
    payload = {
        "forecast_target": "category",
        "target_identifier": "Fabrication & CNC",
        "forecast_horizon_days": 14,
        "historical_bookings": [],  # Empty
        "demo_mode": False,
    }

    response = client.post("/demand-forecast", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert "Insufficient historical booking records" in data["error"]
    assert data["details"]["error_type"] == "INSUFFICIENT_DATA"
    assert data["details"]["required_records"] == 14


def test_demand_forecast_custom_horizon():
    """Verify custom forecast horizon returns exact day count."""
    payload = {
        "forecast_target": "platform",
        "forecast_horizon_days": 7,
        "demo_mode": True,
    }

    response = client.post("/demand-forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["daily_forecasts"]) == 7

