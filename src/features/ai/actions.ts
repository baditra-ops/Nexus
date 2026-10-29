"use server";

import {
  getResourceRecommendations,
  getUtilizationInsights,
  getDemandForecast,
  checkAIReadiness,
  type RecommendationQueryParams,
  type AIResult,
} from "./services/ai-service";
import type {
  AIRecommendationResponse,
  AIUtilizationInsightsResponse,
  AIDemandForecastResponse,
  AIHealthResponse,
} from "./types";

/**
 * Server action to check AI service operational readiness.
 */
export async function checkAIHealthAction(): Promise<{
  isOnline: boolean;
  health?: AIHealthResponse;
}> {
  return checkAIReadiness();
}

/**
 * Server action to generate personalized AI recommendations.
 */
export async function getRecommendationsAction(
  params: RecommendationQueryParams
): Promise<AIResult<AIRecommendationResponse>> {
  if (!params.purposeDescription || params.purposeDescription.trim().length < 3) {
    return {
      error: "Please enter a research or project purpose (at least 3 characters).",
      isAvailable: true,
    };
  }

  return getResourceRecommendations(params);
}

/**
 * Server action to retrieve institutional utilization insights.
 */
export async function getUtilizationInsightsAction(params: {
  timeWindowDays?: number;
  category?: string;
  underutilizedThreshold?: number;
  overutilizedThreshold?: number;
  demoMode?: boolean;
}): Promise<AIResult<AIUtilizationInsightsResponse>> {
  return getUtilizationInsights(params);
}

/**
 * Server action to retrieve demand forecasts.
 */
export async function getDemandForecastAction(params: {
  forecastTarget?: "category" | "resource" | "platform";
  targetIdentifier?: string;
  forecastHorizonDays?: number;
  demoMode?: boolean;
}): Promise<AIResult<AIDemandForecastResponse>> {
  return getDemandForecast(params);
}
