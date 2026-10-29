from typing import List, Optional
from pydantic import BaseModel, Field

from api.schemas.common import BookingRecordInput


class DemandForecastRequest(BaseModel):
    forecast_target: str = Field(
        default="category",
        description="'category', 'resource', or 'platform'",
    )
    target_identifier: Optional[str] = Field(
        default=None,
        description="Category name (e.g. 'Fabrication & CNC') or resource UUID. If None, platform-wide aggregate is forecasted.",
    )
    forecast_horizon_days: int = Field(default=14, ge=1, le=60, description="Number of future days to project")
    historical_bookings: Optional[List[BookingRecordInput]] = Field(
        None, description="Historical booking dataset. If omitted and demo_mode is True, demo historical data is used."
    )
    demo_mode: bool = Field(
        default=False,
        description="If True and historical data is insufficient, clearly labeled synthetic benchmark data is used.",
    )


class ForecastModelMetrics(BaseModel):
    model_name: str
    algorithm_type: str = Field(..., description="'baseline_moving_average' or 'ml_ridge_regression'")
    mean_absolute_error_hours: float
    root_mean_squared_error_hours: float
    r2_score: Optional[float] = None
    evaluation_description: str


class DailyForecastPoint(BaseModel):
    date: str = Field(..., description="Forecast date (YYYY-MM-DD)")
    day_of_week: str = Field(..., description="Monday, Tuesday, ...")
    is_weekend: bool
    predicted_booked_hours: float
    predicted_booking_count: int
    confidence_lower_hours: float
    confidence_upper_hours: float


class DemandForecastResponse(BaseModel):
    success: bool = True
    target: str
    target_identifier: Optional[str] = None
    forecast_horizon_days: int
    is_demo_data: bool
    data_limitation_warning: Optional[str] = None
    baseline_model_metrics: ForecastModelMetrics
    ml_model_metrics: ForecastModelMetrics
    model_comparison_summary: str
    forecast_trend_analysis: str
    assumptions_and_limitations: List[str]
    daily_forecasts: List[DailyForecastPoint]

