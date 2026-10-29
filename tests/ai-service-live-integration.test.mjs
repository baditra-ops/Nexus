import test from "node:test";
import assert from "node:assert/strict";

const AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * LIVE INTEGRATION TEST SUITE
 * Executes real HTTP requests against the live running Nexus AI microservice.
 */

test("Live AI Microservice: GET /health returns operational readiness", async () => {
  const res = await fetch(`${AI_URL}/health`);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.status, "healthy");
  assert.equal(data.service, "nexus-ai-service");
  assert.equal(data.engines.resource_recommender, "operational");
  assert.equal(data.engines.utilization_analyzer, "operational");
  assert.equal(data.engines.demand_forecaster, "operational");
});

test("Live AI Microservice: POST /recommendations returns ranked matches with explainability", async () => {
  const payload = {
    purpose_description: "Need a high-precision digital storage oscilloscope for high-frequency RF signal analysis",
    category: "Electronics & Embedded Kits",
    required_specifications: ["4 channels", "1 GHz", "digital storage"],
    user_profile: {
      id: "u-test-001",
      full_name: "Alice Researcher",
      institution_id: "a0000000-0000-0000-0000-000000000001",
      role: "member",
      verification_status: "verified",
      is_suspended: false,
      certifications: ["Electronics Safety Level 1"],
    },
    limit: 3,
  };

  const res = await fetch(`${AI_URL}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.success, true);
  assert.ok(data.recommendations_count > 0);
  assert.ok(data.total_candidates_analyzed > 0);

  const topRec = data.recommendations[0];
  assert.ok(topRec.match_score_percentage > 50);
  assert.ok(topRec.title.length > 0);
  assert.equal(typeof topRec.is_eligible, "boolean");

  // Priority 4 Explainability Contract
  assert.ok(topRec.explanation.summary.length > 10);
  assert.ok(Array.isArray(topRec.explanation.matched_capabilities));
  assert.ok(topRec.explanation.safety_and_certification.length > 0);
  assert.ok(topRec.explanation.institutional_context.length > 0);

  // Scoring breakdown
  assert.ok(topRec.scoring_breakdown.overall_score > 0);
  assert.ok(topRec.scoring_breakdown.spec_similarity_score >= 0);
});

test("Live AI Microservice: POST /utilization-insights returns underutilization and bottleneck metrics", async () => {
  const payload = {
    time_window_days: 30,
    underutilized_threshold: 0.20,
    overutilized_threshold: 0.75,
    demo_mode: true,
  };

  const res = await fetch(`${AI_URL}/utilization-insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.success, true);
  assert.equal(data.is_demo_data, true);
  assert.ok(data.total_resources_evaluated >= 8);
  assert.ok(data.underutilized_resources.length > 0);
  assert.ok(data.high_demand_resources.length > 0);

  // Validate peak demand telemetry
  assert.ok(data.peak_demand_patterns.busiest_day_of_week.length > 0);
  assert.ok(data.peak_demand_patterns.busiest_time_slot.includes(":"));
});

test("Live AI Microservice: POST /demand-forecast returns ML Ridge Regression vs Moving Average comparison", async () => {
  const payload = {
    forecast_target: "category",
    target_identifier: "Fabrication & CNC",
    forecast_horizon_days: 14,
    demo_mode: true,
  };

  const res = await fetch(`${AI_URL}/demand-forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.success, true);
  assert.equal(data.forecast_horizon_days, 14);
  assert.equal(data.is_demo_data, true);

  // ML model metrics
  assert.equal(data.ml_model_metrics.algorithm_type, "ml_ridge_regression");
  assert.ok(data.ml_model_metrics.mean_absolute_error_hours > 0);
  assert.ok(data.ml_model_metrics.root_mean_squared_error_hours > 0);

  // Baseline metrics
  assert.equal(data.baseline_model_metrics.algorithm_type, "baseline_moving_average");
  assert.ok(data.baseline_model_metrics.mean_absolute_error_hours > 0);

  // Daily points
  assert.equal(data.daily_forecasts.length, 14);
  const firstDay = data.daily_forecasts[0];
  assert.ok(firstDay.date.length === 10);
  assert.equal(typeof firstDay.predicted_booked_hours, "number");
  assert.equal(typeof firstDay.is_weekend, "boolean");
});

test("Live AI Microservice: Rejects malformed requests with standard HTTP 422", async () => {
  const payload = {
    purpose_description: "a", // Less than min_length=3
    user_profile: {
      id: "u-1",
      role: "member",
    },
  };

  const res = await fetch(`${AI_URL}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 422);
  const data = await res.json();
  assert.ok(data.detail);
});
