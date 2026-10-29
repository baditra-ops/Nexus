from fastapi import APIRouter
from api.schemas.utilization_schemas import (
    UtilizationInsightsRequest,
    UtilizationInsightsResponse,
)
from engine.utilization import UtilizationAnalyzer

router = APIRouter(tags=["Utilization"])
analyzer = UtilizationAnalyzer()


@router.post(
    "/utilization-insights",
    response_model=UtilizationInsightsResponse,
    summary="Priority 2: Underutilized Resource Detection",
    description=(
        "Identifies underutilized assets (<20% utilization) and high-demand bottlenecks (>75% utilization "
        "or high waitlists) from operational booking history. Computes day-of-week and time-slot peak patterns. "
        "If real historical data is insufficient, reports the limitation and supports demo_mode=True."
    ),
)
async def get_utilization_insights(request: UtilizationInsightsRequest) -> UtilizationInsightsResponse:
    # InsufficientDataException is handled by the central exception handler in core/exceptions.py
    return analyzer.analyze(request)

