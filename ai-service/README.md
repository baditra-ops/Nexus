# Nexus AI/ML Service

Standalone decision-support and machine learning microservice for **Nexus — Trusted Resource Sharing Platform**.

This service enables cross-institutional sharing of underutilized scientific instruments, prototyping hardware, specialized spaces, and testing facilities by providing:
1. **Resource Matching & Recommendation Engine (Priority 1 & Priority 4)**
2. **Underutilized Resource Detection & Bottleneck Analysis (Priority 2)**
3. **Demand Forecasting with Baseline vs ML Models (Priority 3)**

---

## Architectural Invariant & Security Principles

> [!IMPORTANT]
> **Nexus Security & Integrity Invariant**:
> Identity verification, institutional boundaries, safety certification validity, and final booking approval decisions are **exclusively enforced by the primary Nexus backend (Next.js + Supabase)** and authorized institutional administrators.
>
> The AI service acts strictly as an advisory, decision-support microservice. It does **not** bypass access controls, does **not** automatically approve bookings, and does **not** modify privileged database records.

---

## Tech Stack & Architecture

- **Language & Framework**: Python 3.11+, FastAPI, Pydantic v2
- **Data & ML Libraries**: Scikit-learn, NumPy, Pandas
- **Testing**: Pytest, HTTPX
- **Zero Cost & Self-Contained**: Runs locally without requiring paid AI API keys, Docker, or Redis.

---

## Directory Structure

```
ai-service/
├── api/
│   ├── main.py                       # FastAPI application entrypoint and middleware
│   ├── routes/
│   │   ├── health.py                 # GET /health
│   │   ├── recommendations.py        # POST /recommendations
│   │   ├── utilization.py            # POST /utilization-insights
│   │   └── forecasting.py            # POST /demand-forecast
│   └── schemas/
│       ├── common.py                 # Shared models (Resources, Users, Bookings)
│       ├── recommendation_schemas.py # Recommendation request/response models
│       ├── utilization_schemas.py    # Utilization metrics models
│       └── forecasting_schemas.py    # Forecast models & metrics
├── core/
│   ├── config.py                     # Environment settings
│   └── exceptions.py                 # Custom exceptions & handlers
├── data/
│   ├── sample_data.py                # Schema-aligned benchmark dataset
│   └── sample_catalog.json           # Exportable JSON catalog for testing
├── engine/
│   ├── recommender.py                # TF-IDF + multi-factor recommendation engine
│   ├── utilization.py                # Utilization analyzer & bottleneck detector
│   └── forecaster.py                 # Ridge Regression vs Moving Average forecaster
├── tests/
│   ├── test_health.py                # Health & root route tests
│   ├── test_recommendations.py       # Recommendation engine & edge cases tests
│   ├── test_utilization.py           # Underutilization & limitation tests
│   └── test_forecasting.py           # Forecasting & model comparison tests
├── .env.example                      # Configuration template
├── .gitignore                        # Python gitignore
├── requirements.txt                  # Python dependencies
└── README.md                         # Documentation
```

---

## Installation & Setup

### 1. Create and Activate Virtual Environment

```bash
# From repository root
cd ai-service

# Windows (PowerShell)
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3.11 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Environment variables:
- `HOST`: Host IP binding (default: `127.0.0.1`)
- `PORT`: Service port (default: `8000`)
- `CORS_ORIGINS`: Allowed origins (default: `http://localhost:3000,http://127.0.0.1:3000`)

### 4. Run the Service Locally

```bash
# Using uvicorn directly
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload

# Or run the main script
python -m api.main
```

The interactive OpenAPI (Swagger) documentation is available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc UI**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 5. Run the Test Suite

```bash
pytest tests -v
```

---

## API Endpoints & Request/Response Contracts

### 1. `GET /health`
Verifies microservice operational readiness.

**Sample Response:**
```json
{
  "status": "healthy",
  "service": "nexus-ai-service",
  "version": "1.0.0",
  "environment": "development",
  "engines": {
    "resource_recommender": "operational",
    "utilization_analyzer": "operational",
    "demand_forecaster": "operational"
  },
  "ml_backend": "scikit-learn"
}
```

---

### 2. `POST /recommendations` (Priority 1 & Priority 4)
Ranks suitable resources based on project purpose, explicit technical capabilities, safety prerequisites, schedule fit, and institutional affinity.

**Sample Request:**
```json
{
  "purpose_description": "Need a digital storage oscilloscope for high-frequency signal debugging and logic analysis",
  "category": "Electronics & Embedded Kits",
  "required_specifications": ["4 channels", "1 GHz", "digital storage"],
  "user_profile": {
    "id": "u0000000-0000-0000-0000-000000000001",
    "full_name": "Alice Engineer",
    "institution_id": "a0000000-0000-0000-0000-000000000001",
    "role": "member",
    "verification_status": "verified",
    "is_suspended": false,
    "certifications": ["Electronics Safety Level 1"]
  },
  "limit": 3
}
```

**Sample Response:**
```json
{
  "success": true,
  "total_candidates_analyzed": 8,
  "recommendations_count": 1,
  "user_status_notice": null,
  "architectural_notice": "Nexus Architectural Invariant: Eligibility, identity verification, cross-institution permissions, and booking conflict resolution are exclusively enforced by the primary Nexus backend and institutional administrators.",
  "recommendations": [
    {
      "resource_id": "r0000000-0000-0000-0000-000000000002",
      "title": "Keysight Infiniium 4-Channel 1GHz Digital Storage Oscilloscope",
      "category": "Electronics & Embedded Kits",
      "resource_type": "equipment",
      "institution_id": "a0000000-0000-0000-0000-000000000001",
      "institution_name": "TechCircuit Institute of Technology",
      "location": "Building 4, Electronics Prototyping Lab, Bench 7",
      "deposit_amount": 50.0,
      "currency": "USD",
      "match_score_percentage": 94.6,
      "is_eligible": true,
      "is_available": true,
      "action_required": null,
      "explanation": {
        "summary": "Match Score: 94.6%. Keysight Infiniium 4-Channel 1GHz Digital Storage Oscilloscope aligns with intended research purpose. 3 specifications matched. Located at user's home institution.",
        "matched_capabilities": ["4 channels", "1 GHz", "digital storage"],
        "unmatched_specifications": [],
        "eligibility_assessment": "User verification is in good standing.",
        "safety_and_certification": "User possesses verified prerequisites: Electronics Safety Level 1.",
        "availability_assessment": "Flexible schedule. Ready for on-demand booking window reservation.",
        "institutional_context": "Located at user's home institution (TechCircuit Institute of Technology). Highest booking priority."
      },
      "scoring_breakdown": {
        "spec_similarity_score": 0.88,
        "capability_coverage_score": 1.0,
        "safety_eligibility_score": 1.0,
        "availability_score": 1.0,
        "institution_affinity_score": 1.0,
        "overall_score": 0.946
      }
    }
  ]
}
```

---

### 3. `POST /utilization-insights` (Priority 2)
Analyzes booking frequency, booked hours, and idle times. Detects underutilized assets (<20%) and high-demand bottlenecks (>75%).

**Sample Request:**
```json
{
  "time_window_days": 30,
  "underutilized_threshold": 0.20,
  "overutilized_threshold": 0.75,
  "demo_mode": true
}
```

**Sample Response:**
```json
{
  "success": true,
  "time_window_days": 30,
  "is_demo_data": true,
  "data_limitation_warning": "DEMONSTRATION MODE ACTIVE: Historical operational records supplied were insufficient. Metrics are computed using the platform benchmark sample dataset for development validation.",
  "total_resources_evaluated": 8,
  "average_platform_utilization": 0.442,
  "average_platform_utilization_percentage": "44.2%",
  "underutilized_resources_count": 2,
  "bottleneck_resources_count": 2,
  "peak_demand_patterns": {
    "busiest_day_of_week": "Wednesday",
    "busiest_time_slot": "10:00-12:00",
    "lowest_demand_day_of_week": "Friday",
    "lowest_demand_time_slot": "16:00-18:00"
  },
  "underutilized_resources": [
    {
      "resource_id": "r0000000-0000-0000-0000-000000000005",
      "title": "Class 1000 ISO 6 Cleanroom Photolithography & Etch Bay",
      "category": "Cleanrooms & Specialized Spaces",
      "institution_name": "TechCircuit Institute of Technology",
      "total_available_hours": 171.4,
      "total_booked_hours": 12.0,
      "utilization_rate": 0.07,
      "utilization_percentage": "7.0%",
      "booking_count": 4,
      "completed_bookings": 4,
      "cancelled_bookings": 0,
      "waitlisted_or_rejected": 0,
      "status_classification": "underutilized",
      "actionable_recommendation": "Underutilized (7.0%). Action: Consider lowering deposit requirement (currently $300.00); Host scheduled student training workshops to expand certified user pool; Publish resource availability to inter-institutional partner universities."
    }
  ]
}
```

---

### 4. `POST /demand-forecast` (Priority 3)
Projects future booking volume across a 7- to 60-day horizon using an ML Ridge Regression model with auto-regressive lags, evaluated against a Day-of-Week 4-Week Moving Average baseline.

**Sample Request:**
```json
{
  "forecast_target": "category",
  "target_identifier": "Fabrication & CNC",
  "forecast_horizon_days": 14,
  "demo_mode": true
}
```

**Sample Response:**
```json
{
  "success": true,
  "target": "category",
  "target_identifier": "Fabrication & CNC",
  "forecast_horizon_days": 14,
  "is_demo_data": true,
  "baseline_model_metrics": {
    "model_name": "Baseline (Day-of-Week 4-Week Moving Average)",
    "algorithm_type": "baseline_moving_average",
    "mean_absolute_error_hours": 2.14,
    "root_mean_squared_error_hours": 2.85,
    "r2_score": 0.18,
    "evaluation_description": "Simple heuristic baseline predicting historical average for each weekday."
  },
  "ml_model_metrics": {
    "model_name": "ML Linear Ridge Regression (with Temporal & Lag Features)",
    "algorithm_type": "ml_ridge_regression",
    "mean_absolute_error_hours": 1.38,
    "root_mean_squared_error_hours": 1.72,
    "r2_score": 0.67,
    "evaluation_description": "Trained on calendar periodicity, 1-day lag, 7-day lag, and 7-day moving average. Reduced forecast error by 35.5% relative to baseline."
  },
  "model_comparison_summary": "The ML Ridge Regression model (MAE: 1.38 hrs) outperforms the moving average baseline (MAE: 2.14 hrs) with an estimated 35.5% error reduction.",
  "daily_forecasts": [
    {
      "date": "2026-11-01",
      "day_of_week": "Monday",
      "is_weekend": false,
      "predicted_booked_hours": 5.4,
      "predicted_booking_count": 2,
      "confidence_lower_hours": 3.2,
      "confidence_upper_hours": 7.6
    }
  ]
}
```

---

## Machine Learning vs Baseline Algorithm Breakdown

| Feature | Primary Method | Algorithm Class | Evaluation Metric | Why This Approach | Data Needed to Improve |
|---|---|---|---|---|---|
| **Resource Semantic Spec Matching** | **ML** | TF-IDF Vectorizer + Cosine Similarity (`scikit-learn`) | Cosine Similarity Score (0.0 to 1.0) | Captures unstructured laboratory, tool, and sensor descriptions beyond rigid category tags. | Richer domain-specific corpus of equipment specs and user research abstracts. Can transition to `SentenceTransformers` embeddings. |
| **Capability & Prerequisite Matching** | **Rule / Heuristic** | Keyword extraction & credential set intersection | Coverage ratio (0.0 to 1.0) | Explicit safety protocols (e.g. Laser Safety Level 1) require deterministic verification rather than probabilistic guessing. | Structured taxonomy of safety badges across institutions. |
| **Schedule & Conflict Evaluation** | **Deterministic** | Interval overlap & availability window matching | Binary compatibility & slot penalty | Booking conflicts and facility hours are deterministic hard constraints. | Real-time calendar synchronization logs. |
| **Underutilization Detection** | **Baseline Statistical** | Operational hours ratio + percentile clustering | Utilization Rate (%) | Reliable, non-speculative calculation of real idle hours vs booked time. | Continuous check-in / check-out telemetry and cancellation telemetry. |
| **Demand Forecasting Baseline** | **Baseline Heuristic** | 4-Week Day-of-Week Moving Average | MAE & RMSE | Industry-standard benchmark capturing basic weekly cyclicality. | Historical booking logs. |
| **Demand Forecasting ML** | **ML** | Ridge Regression with L2 Regularization & Temporal Lags | MAE, RMSE, $R^2$ | Avoids overfitting on small academic datasets while modeling weekly seasonality (`lag_7`), short-term momentum (`lag_1`), and moving averages. | 6+ months of real booking data, academic term calendar dates (exam periods, breaks), and weather/holiday factors. |

