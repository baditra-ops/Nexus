from fastapi import APIRouter
from api.schemas.forecasting_schemas import (
    DemandForecastRequest,
    DemandForecastResponse,
)
from engine.forecaster import DemandForecaster

router = APIRouter(tags=["Demand Forecasting"])
forecaster = DemandForecaster()


@router.post(
    "/demand-forecast",
    response_model=DemandForecastResponse,
    summary="Priority 3: Demand Forecasting Engine",
    description=(
        "Projects future resource booking demand across an empirical forecasting horizon. "
        "Trains a Scikit-learn Ridge Regression ML model on calendar features and auto-regressive lags, "
        "and compares performance directly against a 4-week Day-of-Week moving average baseline. "
        "Reports MAE, RMSE, and model limitations."
    ),
)
async def get_demand_forecast(request: DemandForecastRequest) -> DemandForecastResponse:
    # InsufficientDataException is handled by the central exception handler in core/exceptions.py
    return forecaster.forecast(request)

