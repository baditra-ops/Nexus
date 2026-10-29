from typing import List, Optional
from pydantic import BaseModel, Field

from api.schemas.common import ResourceInput, BookingRecordInput


class UtilizationInsightsRequest(BaseModel):
    time_window_days: int = Field(default=30, ge=7, le=365, description="Historical analysis duration in days")
    institution_id: Optional[str] = Field(None, description="Filter metrics by specific institution UUID")
    category: Optional[str] = Field(None, description="Filter metrics by resource category")
    underutilized_threshold: float = Field(
        default=0.20, ge=0.01, le=0.50, description="Utilization below this ratio flags underuse (default 20%)"
    )
    overutilized_threshold: float = Field(
        default=0.75, ge=0.50, le=0.99, description="Utilization above this ratio flags high demand bottleneck"
    )
    resources: Optional[List[ResourceInput]] = Field(
        None, description="Resource catalog. If omitted, standard platform catalog is used."
    )
    bookings: Optional[List[BookingRecordInput]] = Field(
        None, description="Historical booking logs. If omitted or insufficient and demo_mode is True, demo data is analyzed."
    )
    demo_mode: bool = Field(
        default=False,
        description="If True and supplied booking data is insufficient, clearly labeled demonstration dataset is used.",
    )


class ResourceUtilizationMetric(BaseModel):
    resource_id: str
    title: str
    category: str
    institution_name: Optional[str] = None
    total_available_hours: float
    total_booked_hours: float
    utilization_rate: float = Field(..., ge=0.0, le=1.0)
    utilization_percentage: str
    booking_count: int
    completed_bookings: int
    cancelled_bookings: int
    waitlisted_or_rejected: int
    status_classification: str = Field(..., description="'underutilized', 'balanced', or 'high_demand_bottleneck'")
    actionable_recommendation: str


class PeakDemandPattern(BaseModel):
    busiest_day_of_week: str
    busiest_time_slot: str
    lowest_demand_day_of_week: str
    lowest_demand_time_slot: str


class CategoryUtilizationSummary(BaseModel):
    category: str
    resource_count: int
    average_utilization_rate: float
    average_utilization_percentage: str
    total_booking_hours: float


class UtilizationInsightsResponse(BaseModel):
    success: bool = True
    time_window_days: int
    is_demo_data: bool
    data_limitation_warning: Optional[str] = None
    total_resources_evaluated: int
    average_platform_utilization: float
    average_platform_utilization_percentage: str
    underutilized_resources_count: int
    bottleneck_resources_count: int
    category_summaries: List[CategoryUtilizationSummary]
    peak_demand_patterns: PeakDemandPattern
    underutilized_resources: List[ResourceUtilizationMetric]
    high_demand_resources: List[ResourceUtilizationMetric]
    all_resource_metrics: List[ResourceUtilizationMetric]

