/**
 * TypeScript type definitions for the Nexus AI/ML microservice integration.
 * Matches the actual Pydantic schemas in ai-service/api/schemas/.
 */

export interface AIUserProfileInput {
  id: string;
  full_name?: string | null;
  institution_id?: string | null;
  role: string;
  verification_status: string;
  is_suspended: boolean;
  certifications: string[];
}

export interface AIAvailabilitySlotInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface AIResourceInput {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  resource_type: string;
  institution_id?: string | null;
  institution_name?: string | null;
  location?: string | null;
  deposit_amount: number;
  currency: string;
  eligibility_requirements?: string | null;
  usage_rules?: string | null;
  status: string;
  availability_windows?: AIAvailabilitySlotInput[];
}

export interface AIBookingRecordInput {
  id: string;
  resource_id: string;
  borrower_id: string;
  start_time: string;
  end_time: string;
  status: string;
  request_notes?: string | null;
}

export interface AIRecommendationRequest {
  purpose_description: string;
  category?: string | null;
  required_specifications?: string[];
  user_profile: AIUserProfileInput;
  requested_start_time?: string | null;
  requested_end_time?: string | null;
  max_deposit?: number | null;
  preferred_location?: string | null;
  preferred_institution_id?: string | null;
  cross_institution_allowed?: boolean;
  candidate_resources?: AIResourceInput[] | null;
  existing_bookings?: AIBookingRecordInput[] | null;
  limit?: number;
}

export interface AIMatchExplanation {
  summary: string;
  matched_capabilities: string[];
  unmatched_specifications: string[];
  eligibility_assessment: string;
  safety_and_certification: string;
  availability_assessment: string;
  institutional_context: string;
}

export interface AIScoringBreakdown {
  spec_similarity_score: number;
  capability_coverage_score: number;
  safety_eligibility_score: number;
  availability_score: number;
  institution_affinity_score: number;
  overall_score: number;
}

export interface AIResourceRecommendationItem {
  resource_id: string;
  title: string;
  category: string;
  resource_type: string;
  institution_id?: string | null;
  institution_name?: string | null;
  location?: string | null;
  deposit_amount: number;
  currency: string;
  match_score_percentage: number;
  is_eligible: boolean;
  is_available: boolean;
  action_required?: string | null;
  explanation: AIMatchExplanation;
  scoring_breakdown: AIScoringBreakdown;
  // Revalidated live metadata from primary Nexus database
  live_resource_verified?: boolean;
  live_status?: string;
}

export interface AIRecommendationResponse {
  success: boolean;
  total_candidates_analyzed: number;
  recommendations_count: number;
  user_status_notice?: string | null;
  architectural_notice: string;
  recommendations: AIResourceRecommendationItem[];
}

// Utilization Types
export interface AIUtilizationInsightsRequest {
  time_window_days?: number;
  institution_id?: string | null;
  category?: string | null;
  underutilized_threshold?: number;
  overutilized_threshold?: number;
  resources?: AIResourceInput[] | null;
  bookings?: AIBookingRecordInput[] | null;
  demo_mode?: boolean;
}

export interface AIResourceUtilizationMetric {
  resource_id: string;
  title: string;
  category: string;
  institution_name?: string | null;
  total_available_hours: number;
  total_booked_hours: number;
  utilization_rate: number;
  utilization_percentage: string;
  booking_count: number;
  completed_bookings: number;
  cancelled_bookings: number;
  waitlisted_or_rejected: number;
  status_classification: "underutilized" | "balanced" | "high_demand_bottleneck";
  actionable_recommendation: string;
}

export interface AIPeakDemandPattern {
  busiest_day_of_week: string;
  busiest_time_slot: string;
  lowest_demand_day_of_week: string;
  lowest_demand_time_slot: string;
}

export interface AICategoryUtilizationSummary {
  category: string;
  resource_count: number;
  average_utilization_rate: number;
  average_utilization_percentage: string;
  total_booking_hours: number;
}

export interface AIUtilizationInsightsResponse {
  success: boolean;
  time_window_days: number;
  is_demo_data: boolean;
  data_limitation_warning?: string | null;
  total_resources_evaluated: number;
  average_platform_utilization: number;
  average_platform_utilization_percentage: string;
  underutilized_resources_count: number;
  bottleneck_resources_count: number;
  category_summaries: AICategoryUtilizationSummary[];
  peak_demand_patterns: AIPeakDemandPattern;
  underutilized_resources: AIResourceUtilizationMetric[];
  high_demand_resources: AIResourceUtilizationMetric[];
  all_resource_metrics: AIResourceUtilizationMetric[];
}

// Forecasting Types
export interface AIDemandForecastRequest {
  forecast_target?: "category" | "resource" | "platform";
  target_identifier?: string | null;
  forecast_horizon_days?: number;
  historical_bookings?: AIBookingRecordInput[] | null;
  demo_mode?: boolean;
}

export interface AIForecastModelMetrics {
  model_name: string;
  algorithm_type: "baseline_moving_average" | "ml_ridge_regression";
  mean_absolute_error_hours: number;
  root_mean_squared_error_hours: number;
  r2_score?: number | null;
  evaluation_description: string;
}

export interface AIDailyForecastPoint {
  date: string;
  day_of_week: string;
  is_weekend: boolean;
  predicted_booked_hours: number;
  predicted_booking_count: number;
  confidence_lower_hours: number;
  confidence_upper_hours: number;
}

export interface AIDemandForecastResponse {
  success: boolean;
  target: string;
  target_identifier?: string | null;
  forecast_horizon_days: number;
  is_demo_data: boolean;
  data_limitation_warning?: string | null;
  baseline_model_metrics: AIForecastModelMetrics;
  ml_model_metrics: AIForecastModelMetrics;
  model_comparison_summary: string;
  forecast_trend_analysis: string;
  assumptions_and_limitations: string[];
  daily_forecasts: AIDailyForecastPoint[];
}

export interface AIHealthResponse {
  status: "healthy" | "unhealthy";
  service: string;
  version: string;
  environment: string;
  engines: {
    resource_recommender: string;
    utilization_analyzer: string;
    demand_forecaster: string;
  };
  ml_backend: string;
}
