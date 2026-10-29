/**
 * Secure, server-side HTTP client for communicating with the Nexus AI/ML microservice.
 * Enforces request timeouts, structured error handling, and never exposes internal credentials.
 */

import type {
  AIHealthResponse,
  AIRecommendationRequest,
  AIRecommendationResponse,
  AIUtilizationInsightsRequest,
  AIUtilizationInsightsResponse,
  AIDemandForecastRequest,
  AIDemandForecastResponse,
} from "./types";

export class AIServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export class AIServiceUnavailableError extends AIServiceError {
  constructor(message: string = "Nexus AI decision-support service is currently unavailable. Standard platform discovery and search remain fully functional.") {
    super(message, 503, { code: "AI_SERVICE_UNAVAILABLE" });
    this.name = "AIServiceUnavailableError";
  }
}

export class AIServiceTimeoutError extends AIServiceError {
  constructor(message: string = "Nexus AI service request timed out.") {
    super(message, 504, { code: "AI_SERVICE_TIMEOUT" });
    this.name = "AIServiceTimeoutError";
  }
}

export class InsufficientDataError extends AIServiceError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 422, details);
    this.name = "InsufficientDataError";
  }
}

/**
 * Returns the base URL for the AI microservice.
 * Server-only environment variable, defaults to local host.
 */
export function getAIServiceUrl(): string {
  const url = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
  return url.replace(/\/+$/, "");
}

const DEFAULT_TIMEOUT_MS = 6000;

async function executeAIRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const { method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const baseUrl = getAIServiceUrl();
  const url = `${baseUrl}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      let errorMessage = `AI Service returned HTTP ${response.status}`;

      if (isJson) {
        try {
          errorData = (await response.json()) as Record<string, unknown>;
          if (typeof errorData.detail === "string") {
            errorMessage = errorData.detail;
          } else if (typeof errorData.error === "string") {
            errorMessage = errorData.error;
          }
        } catch {
          // ignore parse errors
        }
      }

      if (response.status === 422 && (errorData.details as Record<string, unknown>)?.error_type === "INSUFFICIENT_DATA") {
        throw new InsufficientDataError(errorMessage, errorData.details as Record<string, unknown>);
      }

      throw new AIServiceError(errorMessage, response.status, errorData);
    }

    if (!isJson) {
      throw new AIServiceError("AI Service returned unexpected non-JSON response.", 502);
    }

    const data = (await response.json()) as T;
    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof AIServiceError) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new AIServiceTimeoutError();
      }
      // Check for connection refused or network errors
      const msg = err.message.toLowerCase();
      if (
        msg.includes("fetch failed") ||
        msg.includes("econnrefused") ||
        msg.includes("network error") ||
        msg.includes("connection refused")
      ) {
        throw new AIServiceUnavailableError();
      }
    }

    throw new AIServiceUnavailableError(
      err instanceof Error ? err.message : "Failed to communicate with AI Service"
    );
  }
}

/**
 * Health check on the AI microservice.
 */
export async function getAIHealth(): Promise<AIHealthResponse> {
  return executeAIRequest<AIHealthResponse>("/health", { method: "GET", timeoutMs: 3000 });
}

/**
 * Submits user requirement context to get ranked resource recommendations.
 */
export async function postRecommendations(
  payload: AIRecommendationRequest
): Promise<AIRecommendationResponse> {
  return executeAIRequest<AIRecommendationResponse>("/recommendations", {
    method: "POST",
    body: payload,
  });
}

/**
 * Retrieves underutilization & bottleneck metrics.
 */
export async function postUtilizationInsights(
  payload: AIUtilizationInsightsRequest
): Promise<AIUtilizationInsightsResponse> {
  return executeAIRequest<AIUtilizationInsightsResponse>("/utilization-insights", {
    method: "POST",
    body: payload,
  });
}

/**
 * Projects demand forecasting comparing baseline vs ML models.
 */
export async function postDemandForecast(
  payload: AIDemandForecastRequest
): Promise<AIDemandForecastResponse> {
  return executeAIRequest<AIDemandForecastResponse>("/demand-forecast", {
    method: "POST",
    body: payload,
  });
}
