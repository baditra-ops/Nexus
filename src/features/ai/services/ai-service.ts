/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Secure Integration Service for Nexus AI/ML Capabilities.
 * Orchestrates authorized data fetching, user sanitization, AI microservice dispatch,
 * and live catalog revalidation.
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  postRecommendations,
  postUtilizationInsights,
  postDemandForecast,
  getAIHealth,
  AIServiceUnavailableError,
  InsufficientDataError,
} from "../client";
import type {
  AIRecommendationRequest,
  AIRecommendationResponse,
  AIResourceInput,
  AIBookingRecordInput,
  AIUserProfileInput,
  AIUtilizationInsightsResponse,
  AIDemandForecastResponse,
  AIHealthResponse,
} from "../types";

export interface RecommendationQueryParams {
  purposeDescription: string;
  category?: string;
  requiredSpecifications?: string[];
  requestedStartTime?: string;
  requestedEndTime?: string;
  maxDeposit?: number;
  preferredLocation?: string;
  preferredInstitutionId?: string;
  crossInstitutionAllowed?: boolean;
  limit?: number;
}

export interface AIResult<T> {
  data?: T;
  error?: string;
  isAvailable: boolean;
  insufficientData?: boolean;
  dataLimitationWarning?: string | null;
}

/**
 * Checks if the AI microservice is responsive and operational.
 */
export async function checkAIReadiness(): Promise<{
  isOnline: boolean;
  health?: AIHealthResponse;
}> {
  try {
    const health = await getAIHealth();
    return { isOnline: health.status === "healthy", health };
  } catch {
    return { isOnline: false };
  }
}

/**
 * Retrieves AI-assisted resource recommendations with live database revalidation.
 * Enforces authentication, extracts certified safety badges, and passes active candidate catalog.
 */
export async function getResourceRecommendations(
  params: RecommendationQueryParams
): Promise<AIResult<AIRecommendationResponse>> {
  const { user, profile } = await getCurrentUser();

  if (!user || !profile) {
    return {
      error: "Authentication required to request personalized AI recommendations.",
      isAvailable: true,
    };
  }

  const supabase = await createClient();

  // 1. Fetch user's verified safety training badges from passed eligibility checks
  const { data: passedChecks } = await (supabase.from("eligibility_checks") as any)
    .select("requirement")
    .eq("status", "passed");

  const certifications: string[] = passedChecks
    ? Array.from(new Set(passedChecks.map((c: any) => c.requirement).filter(Boolean)))
    : [];

  // Construct sanitized, non-privileged user profile for the AI engine
  const userProfileInput: AIUserProfileInput = {
    id: user.id,
    full_name: profile.full_name || "Nexus Researcher",
    institution_id: profile.institution_id || undefined,
    role: profile.role || "member",
    verification_status: profile.verification_status || "unverified",
    is_suspended: Boolean(profile.is_suspended),
    certifications,
  };

  // 2. Query published resources from Supabase to provide candidate pool
  const { data: dbResources, error: resError } = await (supabase.from("resources") as any)
    .select(
      `
      id,
      title,
      description,
      category,
      resource_type,
      institution_id,
      location,
      deposit_amount,
      currency,
      eligibility_requirements,
      usage_rules,
      status,
      institution:institutions (name),
      resource_availability (day_of_week, start_time, end_time)
    `
    )
    .eq("status", "published");

  if (resError) {
    console.error("[AIService] Failed to query candidate resources:", resError.message);
  }

  const candidateResources: AIResourceInput[] = (dbResources || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description || null,
    category: r.category,
    resource_type: r.resource_type || "equipment",
    institution_id: r.institution_id || null,
    institution_name: r.institution?.name || null,
    location: r.location || null,
    deposit_amount: Number(r.deposit_amount) || 0,
    currency: r.currency || "USD",
    eligibility_requirements: r.eligibility_requirements || null,
    usage_rules: r.usage_rules || null,
    status: r.status,
    availability_windows: (r.resource_availability || []).map((slot: any) => ({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
    })),
  }));

  // 3. Query existing bookings on candidate resources for calendar conflict checking
  const { data: dbBookings } = await (supabase.from("bookings") as any)
    .select("id, resource_id, borrower_id, start_time, end_time, status, request_notes")
    .in("status", ["approved", "checked_out"]);

  const existingBookings: AIBookingRecordInput[] = (dbBookings || []).map((b: any) => ({
    id: b.id,
    resource_id: b.resource_id,
    borrower_id: b.borrower_id,
    start_time: b.start_time,
    end_time: b.end_time,
    status: b.status,
    request_notes: b.request_notes || null,
  }));

  // Build the strict request payload
  const requestPayload: AIRecommendationRequest = {
    purpose_description: params.purposeDescription.trim(),
    category: params.category && params.category !== "All" && params.category !== "All Categories" ? params.category : null,
    required_specifications: params.requiredSpecifications || [],
    user_profile: userProfileInput,
    requested_start_time: params.requestedStartTime || null,
    requested_end_time: params.requestedEndTime || null,
    max_deposit: params.maxDeposit ?? null,
    preferred_location: params.preferredLocation?.trim() || null,
    preferred_institution_id: params.preferredInstitutionId || null,
    cross_institution_allowed: params.crossInstitutionAllowed ?? true,
    candidate_resources: candidateResources.length > 0 ? candidateResources : null,
    existing_bookings: existingBookings.length > 0 ? existingBookings : null,
    limit: Math.min(Math.max(1, params.limit || 5), 20),
  };

  try {
    const aiResponse = await postRecommendations(requestPayload);

    // Live validation: Reverify that all recommended items match real published resources
    const validResourceMap = new Map(candidateResources.map((r) => [r.id, r]));

    const verifiedRecommendations = aiResponse.recommendations.map((rec) => {
      const liveResource = validResourceMap.get(rec.resource_id);
      return {
        ...rec,
        live_resource_verified: Boolean(liveResource),
        live_status: liveResource ? liveResource.status : "unverified",
      };
    });

    return {
      data: {
        ...aiResponse,
        recommendations: verifiedRecommendations,
      },
      isAvailable: true,
    };
  } catch (err: unknown) {
    if (err instanceof AIServiceUnavailableError) {
      return {
        error: "AI recommendation microservice is offline or unreachable. Standard search and filters remain available.",
        isAvailable: false,
      };
    }
    const message = err instanceof Error ? err.message : "Error generating AI recommendations";
    return {
      error: message,
      isAvailable: true,
    };
  }
}

/**
 * Retrieves resource utilization metrics & bottleneck detections.
 * Restricts queries strictly to resources and bookings authorized to the current user's institution/ownership.
 */
export async function getUtilizationInsights(params: {
  timeWindowDays?: number;
  category?: string;
  underutilizedThreshold?: number;
  overutilizedThreshold?: number;
  demoMode?: boolean;
}): Promise<AIResult<AIUtilizationInsightsResponse>> {
  const { user, profile } = await getCurrentUser();

  if (!user || !profile) {
    return {
      error: "Authentication required to access utilization analytics.",
      isAvailable: true,
    };
  }

  // Authorization: must be institution_admin or resource_owner
  if (profile.role !== "institution_admin" && profile.role !== "resource_owner") {
    return {
      error: "Access restricted: Only institutional administrators and resource owners can view utilization insights.",
      isAvailable: true,
    };
  }

  const supabase = await createClient();

  // Query authorized resources
  let resourceQuery = (supabase.from("resources") as any).select(
    `
    id,
    title,
    category,
    resource_type,
    institution_id,
    location,
    deposit_amount,
    currency,
    status,
    institution:institutions (name),
    resource_availability (day_of_week, start_time, end_time)
  `
  );

  if (profile.role === "institution_admin" && profile.institution_id) {
    resourceQuery = resourceQuery.eq("institution_id", profile.institution_id);
  } else {
    // Resource owner: scope to own resources
    resourceQuery = resourceQuery.eq("owner_id", user.id);
  }

  const { data: dbResources } = await resourceQuery;
  const authorizedResourceIds = (dbResources || []).map((r: any) => r.id);

  if (authorizedResourceIds.length === 0 && !params.demoMode) {
    return {
      insufficientData: true,
      error: "No managed resources found for your account to calculate utilization metrics.",
      isAvailable: true,
    };
  }

  // Query historical bookings for authorized resources within the time window
  const windowDays = params.timeWindowDays || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);

  const bookingQuery = (supabase.from("bookings") as any)
    .select("id, resource_id, borrower_id, start_time, end_time, status, request_notes")
    .in("resource_id", authorizedResourceIds)
    .gte("created_at", cutoffDate.toISOString());

  const { data: dbBookings } = await bookingQuery;

  const realBookings: AIBookingRecordInput[] = (dbBookings || []).map((b: any) => ({
    id: b.id,
    resource_id: b.resource_id,
    borrower_id: b.borrower_id,
    start_time: b.start_time,
    end_time: b.end_time,
    status: b.status,
    request_notes: b.request_notes || null,
  }));

  const realResources: AIResourceInput[] = (dbResources || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    resource_type: r.resource_type || "equipment",
    institution_id: r.institution_id || null,
    institution_name: r.institution?.name || null,
    location: r.location || null,
    deposit_amount: Number(r.deposit_amount) || 0,
    currency: r.currency || "USD",
    status: r.status,
    availability_windows: (r.resource_availability || []).map((slot: any) => ({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
    })),
  }));

  try {
    const aiResponse = await postUtilizationInsights({
      time_window_days: windowDays,
      institution_id: profile.institution_id || undefined,
      category: params.category && params.category !== "All" ? params.category : undefined,
      underutilized_threshold: params.underutilizedThreshold || 0.20,
      overutilized_threshold: params.overutilizedThreshold || 0.75,
      resources: realResources.length > 0 ? realResources : null,
      bookings: realBookings.length > 0 ? realBookings : null,
      demo_mode: Boolean(params.demoMode),
    });

    return {
      data: aiResponse,
      isAvailable: true,
      dataLimitationWarning: aiResponse.data_limitation_warning,
    };
  } catch (err: unknown) {
    if (err instanceof InsufficientDataError) {
      return {
        insufficientData: true,
        error: err.message,
        isAvailable: true,
      };
    }
    if (err instanceof AIServiceUnavailableError) {
      return {
        error: "AI utilization analyzer microservice is currently unreachable.",
        isAvailable: false,
      };
    }
    const message = err instanceof Error ? err.message : "Error analyzing resource utilization";
    return {
      error: message,
      isAvailable: true,
    };
  }
}

/**
 * Projects future booking demand comparing baseline vs ML models.
 * Restricts queries strictly to authorized resources/categories.
 */
export async function getDemandForecast(params: {
  forecastTarget?: "category" | "resource" | "platform";
  targetIdentifier?: string;
  forecastHorizonDays?: number;
  demoMode?: boolean;
}): Promise<AIResult<AIDemandForecastResponse>> {
  const { user, profile } = await getCurrentUser();

  if (!user || !profile) {
    return {
      error: "Authentication required to access demand forecasting.",
      isAvailable: true,
    };
  }

  // Authorization: must be institution_admin or resource_owner
  if (profile.role !== "institution_admin" && profile.role !== "resource_owner") {
    return {
      error: "Access restricted: Only institutional administrators and resource owners can view demand forecasts.",
      isAvailable: true,
    };
  }

  const supabase = await createClient();

  // Query historical bookings for forecasting
  const { data: dbBookings } = await (supabase.from("bookings") as any)
    .select("id, resource_id, borrower_id, start_time, end_time, status, request_notes")
    .in("status", ["approved", "checked_out", "returned", "completed"]);

  const historicalBookings: AIBookingRecordInput[] = (dbBookings || []).map((b: any) => ({
    id: b.id,
    resource_id: b.resource_id,
    borrower_id: b.borrower_id,
    start_time: b.start_time,
    end_time: b.end_time,
    status: b.status,
    request_notes: b.request_notes || null,
  }));

  try {
    const aiResponse = await postDemandForecast({
      forecast_target: params.forecastTarget || "category",
      target_identifier: params.targetIdentifier || undefined,
      forecast_horizon_days: params.forecastHorizonDays || 14,
      historical_bookings: historicalBookings.length >= 14 ? historicalBookings : null,
      demo_mode: Boolean(params.demoMode),
    });

    return {
      data: aiResponse,
      isAvailable: true,
      dataLimitationWarning: aiResponse.data_limitation_warning,
    };
  } catch (err: unknown) {
    if (err instanceof InsufficientDataError) {
      return {
        insufficientData: true,
        error: err.message,
        isAvailable: true,
      };
    }
    if (err instanceof AIServiceUnavailableError) {
      return {
        error: "AI demand forecasting microservice is currently unreachable.",
        isAvailable: false,
      };
    }
    const message = err instanceof Error ? err.message : "Error projecting demand forecast";
    return {
      error: message,
      isAvailable: true,
    };
  }
}
