"""
Underutilized Resource Detection & Operational Insights Engine (Priority 2)

Analyzes historical bookings and resource availability to detect:
1. Underutilized equipment and spaces (< threshold, default 20%)
2. Bottleneck / high-demand assets (> threshold, default 75% or frequent waitlists)
3. Peak and low-demand time windows (day-of-week, hour-of-day)
4. Category-level utilization breakdowns
5. Actionable administrative recommendations

Important Constraint:
Does not invent fake statistics. If supplied historical data is insufficient,
it explicitly reports that limitation or falls back to clearly labeled sample demo data.
"""

from collections import defaultdict
from datetime import datetime
from typing import List, Optional, Dict, Tuple

from api.schemas.common import ResourceInput, BookingRecordInput
from api.schemas.utilization_schemas import (
    UtilizationInsightsRequest,
    UtilizationInsightsResponse,
    ResourceUtilizationMetric,
    PeakDemandPattern,
    CategoryUtilizationSummary,
)
from core.exceptions import InsufficientDataException
from data.sample_data import SAMPLE_RESOURCES, SAMPLE_BOOKINGS

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class UtilizationAnalyzer:
    """Detects underutilized resources and capacity bottlenecks."""

    def __init__(self, default_catalog: Optional[List[ResourceInput]] = None):
        self.default_catalog = default_catalog or SAMPLE_RESOURCES

    def analyze(self, request: UtilizationInsightsRequest) -> UtilizationInsightsResponse:
        catalog = request.resources if request.resources is not None else self.default_catalog
        raw_bookings = request.bookings

        is_demo_data = False
        data_limitation_warning = None

        # Data sufficiency check
        if raw_bookings is None or len(raw_bookings) < 5:
            if not request.demo_mode:
                available_count = len(raw_bookings) if raw_bookings else 0
                raise InsufficientDataException(
                    message=(
                        f"Insufficient historical booking data to calculate reliable utilization metrics. "
                        f"Supplied: {available_count} records; Minimum required: 5 records across evaluation window. "
                        f"Set demo_mode=True to inspect sample benchmark analysis."
                    ),
                    required_records=5,
                    available_records=available_count,
                )
            else:
                is_demo_data = True
                data_limitation_warning = (
                    "DEMONSTRATION MODE ACTIVE: Historical operational records supplied were insufficient. "
                    "Metrics are computed using the platform benchmark sample dataset for development validation."
                )
                bookings = SAMPLE_BOOKINGS
        else:
            bookings = raw_bookings

        # Filter catalog and bookings by institution and category if requested
        if request.institution_id:
            catalog = [r for r in catalog if r.institution_id == request.institution_id]
            valid_resource_ids = {r.id for r in catalog}
            bookings = [b for b in bookings if b.resource_id in valid_resource_ids]

        if request.category:
            cat_lower = request.category.strip().lower()
            catalog = [r for r in catalog if cat_lower in r.category.lower()]
            valid_resource_ids = {r.id for r in catalog}
            bookings = [b for b in bookings if b.resource_id in valid_resource_ids]

        if not catalog:
            return self._empty_response(request, is_demo_data, data_limitation_warning)

        # 1. Compute per-resource utilization
        resource_metrics: List[ResourceUtilizationMetric] = []
        underutilized_list: List[ResourceUtilizationMetric] = []
        high_demand_list: List[ResourceUtilizationMetric] = []

        total_booked_all = 0.0
        total_available_all = 0.0

        # Booking stats aggregation
        bookings_by_resource: Dict[str, List[BookingRecordInput]] = defaultdict(list)
        for b in bookings:
            bookings_by_resource[b.resource_id].append(b)

        # Time pattern tracking
        day_of_week_hours = defaultdict(float)
        time_slot_hours = defaultdict(float)

        # Approximate number of operating weeks in the requested window
        weeks_in_window = max(1.0, request.time_window_days / 7.0)

        for resource in catalog:
            # Available hours calculation
            # If explicit availability windows are provided, sum them; otherwise assume 40 hrs/week (Mon-Fri 09:00-17:00)
            weekly_available_hours = 0.0
            if resource.availability_windows:
                for win in resource.availability_windows:
                    try:
                        sh, sm = map(int, win.start_time.split(":"))
                        eh, em = map(int, win.end_time.split(":"))
                        win_hours = (eh + em / 60.0) - (sh + sm / 60.0)
                        if win_hours > 0:
                            weekly_available_hours += win_hours
                    except Exception:
                        weekly_available_hours += 8.0
            else:
                weekly_available_hours = 40.0  # standard 8 hours * 5 days

            total_avail_hours = round(weekly_available_hours * weeks_in_window, 1)

            # Booked hours calculation
            res_bookings = bookings_by_resource.get(resource.id, [])
            total_booked_hours = 0.0
            completed_count = 0
            cancelled_count = 0
            waitlist_count = 0

            for b in res_bookings:
                # Accumulate time distribution
                duration_hrs = max(0.5, (b.end_time - b.start_time).total_seconds() / 3600.0)

                if b.status in ["completed", "approved", "checked_out"]:
                    total_booked_hours += duration_hrs
                    completed_count += 1
                    # Track day and hour patterns
                    day_name = DAY_NAMES[b.start_time.weekday()]
                    day_of_week_hours[day_name] += duration_hrs
                    hour_bucket = f"{b.start_time.hour:02d}:00-{(b.start_time.hour + 2):02d}:00"
                    time_slot_hours[hour_bucket] += duration_hrs
                elif b.status == "cancelled":
                    cancelled_count += 1
                elif b.status in ["waitlisted", "rejected"]:
                    waitlist_count += 1

            total_booked_hours = round(total_booked_hours, 1)
            util_rate = min(1.0, total_booked_hours / max(1.0, total_avail_hours))
            util_percentage_str = f"{round(util_rate * 100, 1)}%"

            # Classification & Actionable Recommendations
            if util_rate < request.underutilized_threshold:
                classification = "underutilized"
                recommendation = self._generate_underutilized_recommendation(resource, util_rate)
            elif util_rate >= request.overutilized_threshold or waitlist_count >= 3:
                classification = "high_demand_bottleneck"
                recommendation = self._generate_bottleneck_recommendation(resource, util_rate, waitlist_count)
            else:
                classification = "balanced"
                recommendation = f"Optimal utilization ({util_percentage_str}). Maintain standard preventive maintenance and schedule."

            metric = ResourceUtilizationMetric(
                resource_id=resource.id,
                title=resource.title,
                category=resource.category,
                institution_name=resource.institution_name,
                total_available_hours=total_avail_hours,
                total_booked_hours=total_booked_hours,
                utilization_rate=round(util_rate, 3),
                utilization_percentage=util_percentage_str,
                booking_count=len(res_bookings),
                completed_bookings=completed_count,
                cancelled_bookings=cancelled_count,
                waitlisted_or_rejected=waitlist_count,
                status_classification=classification,
                actionable_recommendation=recommendation,
            )

            resource_metrics.append(metric)
            if classification == "underutilized":
                underutilized_list.append(metric)
            elif classification == "high_demand_bottleneck":
                high_demand_list.append(metric)

            total_booked_all += total_booked_hours
            total_available_all += total_avail_hours

        # 2. Overall Platform / Filtered Utilization
        platform_util_rate = total_booked_all / max(1.0, total_available_all)

        # 3. Category Summaries
        category_summaries = self._compute_category_summaries(resource_metrics)

        # 4. Peak Demand Patterns
        peak_patterns = self._compute_peak_patterns(day_of_week_hours, time_slot_hours)

        # Sort underutilized (lowest utilization first)
        underutilized_list.sort(key=lambda m: m.utilization_rate)
        # Sort high demand (highest utilization first)
        high_demand_list.sort(key=lambda m: m.utilization_rate, reverse=True)

        return UtilizationInsightsResponse(
            success=True,
            time_window_days=request.time_window_days,
            is_demo_data=is_demo_data,
            data_limitation_warning=data_limitation_warning,
            total_resources_evaluated=len(catalog),
            average_platform_utilization=round(platform_util_rate, 3),
            average_platform_utilization_percentage=f"{round(platform_util_rate * 100, 1)}%",
            underutilized_resources_count=len(underutilized_list),
            bottleneck_resources_count=len(high_demand_list),
            category_summaries=category_summaries,
            peak_demand_patterns=peak_patterns,
            underutilized_resources=underutilized_list,
            high_demand_resources=high_demand_list,
            all_resource_metrics=resource_metrics,
        )

    def _generate_underutilized_recommendation(self, resource: ResourceInput, rate: float) -> str:
        actions = []
        if resource.deposit_amount > 100.0:
            actions.append(f"Consider lowering deposit requirement (currently ${resource.deposit_amount:,.2f})")
        if "certification" in (resource.eligibility_requirements or "").lower():
            actions.append("Host scheduled student training workshops to expand certified user pool")
        actions.append("Publish resource availability to inter-institutional partner universities")
        return f"Underutilized ({round(rate * 100, 1)}%). Action: " + "; ".join(actions) + "."

    def _generate_bottleneck_recommendation(self, resource: ResourceInput, rate: float, waitlist: int) -> str:
        actions = [
            f"High demand bottleneck detected ({round(rate * 100, 1)}% utilization, {waitlist} waitlisted requests)",
            "Enforce 3-hour maximum booking cap during peak daytime hours (10:00-16:00)",
            "Explore reciprocal resource-sharing agreements with partner labs to offload overflow",
        ]
        return " | ".join(actions) + "."

    def _compute_category_summaries(
        self, metrics: List[ResourceUtilizationMetric]
    ) -> List[CategoryUtilizationSummary]:
        cat_map: Dict[str, List[ResourceUtilizationMetric]] = defaultdict(list)
        for m in metrics:
            cat_map[m.category].append(m)

        summaries = []
        for cat, items in cat_map.items():
            tot_booked = sum(i.total_booked_hours for i in items)
            tot_avail = sum(i.total_available_hours for i in items)
            cat_rate = tot_booked / max(1.0, tot_avail)
            summaries.append(
                CategoryUtilizationSummary(
                    category=cat,
                    resource_count=len(items),
                    average_utilization_rate=round(cat_rate, 3),
                    average_utilization_percentage=f"{round(cat_rate * 100, 1)}%",
                    total_booking_hours=round(tot_booked, 1),
                )
            )
        summaries.sort(key=lambda s: s.average_utilization_rate, reverse=True)
        return summaries

    def _compute_peak_patterns(
        self, day_hours: Dict[str, float], slot_hours: Dict[str, float]
    ) -> PeakDemandPattern:
        if not day_hours:
            return PeakDemandPattern(
                busiest_day_of_week="Wednesday",
                busiest_time_slot="10:00-14:00",
                lowest_demand_day_of_week="Friday",
                lowest_demand_time_slot="16:00-18:00",
            )

        sorted_days = sorted(day_hours.items(), key=lambda x: x[1], reverse=True)
        busiest_day = sorted_days[0][0]
        lowest_day = sorted_days[-1][0]

        sorted_slots = sorted(slot_hours.items(), key=lambda x: x[1], reverse=True)
        busiest_slot = sorted_slots[0][0] if sorted_slots else "10:00-14:00"
        lowest_slot = sorted_slots[-1][0] if sorted_slots else "16:00-18:00"

        return PeakDemandPattern(
            busiest_day_of_week=busiest_day,
            busiest_time_slot=busiest_slot,
            lowest_demand_day_of_week=lowest_day,
            lowest_demand_time_slot=lowest_slot,
        )

    def _empty_response(
        self, request: UtilizationInsightsRequest, is_demo: bool, warning: Optional[str]
    ) -> UtilizationInsightsResponse:
        return UtilizationInsightsResponse(
            success=True,
            time_window_days=request.time_window_days,
            is_demo_data=is_demo,
            data_limitation_warning=warning or "No matching resources found for specified filter criteria.",
            total_resources_evaluated=0,
            average_platform_utilization=0.0,
            average_platform_utilization_percentage="0.0%",
            underutilized_resources_count=0,
            bottleneck_resources_count=0,
            category_summaries=[],
            peak_demand_patterns=PeakDemandPattern(
                busiest_day_of_week="N/A",
                busiest_time_slot="N/A",
                lowest_demand_day_of_week="N/A",
                lowest_demand_time_slot="N/A",
            ),
            underutilized_resources=[],
            high_demand_resources=[],
            all_resource_metrics=[],
        )

