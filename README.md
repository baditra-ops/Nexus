# Nexus — Trusted Resource Sharing Platform

Nexus is an inter-institutional resource sharing platform enabling universities and research consortiums to securely discover, loan, and maximize utilization of high-value scientific apparatus, prototyping hardware, cleanrooms, and testing facilities.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase**, and a standalone **FastAPI + Scikit-learn AI/ML Decision-Support Microservice**.

---

## Architectural Invariant & Security Principles

> [!IMPORTANT]
> **Nexus Security & Integrity Invariant**:
> Identity verification, institutional boundaries, safety certification validity, and final booking approval decisions are **exclusively enforced by the primary Nexus backend (Next.js + Supabase)** and authorized institutional administrators.
>
> The AI service acts strictly as an advisory, decision-support microservice. It does **not** bypass access controls, does **not** automatically approve bookings, and does **not** modify privileged database records.

---

## Integrated System Architecture

Nexus operates as two cooperating processes in local development:
1. **Primary Nexus Web Application** (Next.js App Router, port `3000`):
   - Authenticated research discovery, booking management, custodial check-in/return workflows, and administrative governance.
   - Secure server-side integration layer (`src/features/ai/`) that authenticates callers, sanitizes user context, queries authorized resources/bookings, dispatches requests to the AI microservice, and revalidates live results.
2. **AI/ML Decision-Support Microservice** (FastAPI + Scikit-learn, port `8000`):
   - **Priority 1 & 4**: TF-IDF specification similarity matching, capability coverage, prerequisite credential checking, and explainable AI scoring breakdown (`POST /recommendations`).
   - **Priority 2**: Underutilized resource detection (<20% utilization) and high-demand bottleneck detection (>75% utilization / waitlists) with peak demand telemetry (`POST /utilization-insights`).
   - **Priority 3**: Demand forecasting comparing Scikit-learn Ridge Regression (with calendar periodicity and auto-regressive lags) against a 4-week Day-of-Week moving average baseline (`POST /demand-forecast`).

---

## Prerequisites

- **Node.js**: v20.x or higher
- **Python**: 3.11+ (Python 3.11 is strongly recommended for pre-built Scikit-learn, NumPy, and SciPy binary wheels)
- **Git**

---

## Step-by-Step Installation & Local Run Instructions

### Step 1: Clone and Configure Environment Variables

1. Copy `.env.example` to `.env.local` in the project root:
   ```bash
   cp .env.example .env.local
   ```
2. Verify that `.env.local` contains the server-only configuration:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Server-side AI Microservice URL (DO NOT prefix with NEXT_PUBLIC_)
   AI_SERVICE_URL=http://127.0.0.1:8000
   ```

### Step 2: Install Next.js Application Dependencies

```bash
npm install
```

### Step 3: Install AI Microservice Dependencies

```bash
cd ai-service

# Windows (PowerShell)
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Linux / macOS
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd ..
```

### Step 4: Start the AI/ML Microservice (Terminal 1)

```bash
# Windows
.\ai-service\venv\Scripts\python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload

# Linux / macOS
./ai-service/venv/bin/uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

The AI microservice will start at `http://127.0.0.1:8000`. You can inspect the interactive OpenAPI Swagger UI at `http://127.0.0.1:8000/docs`.

### Step 5: Start the Next.js Application (Terminal 2)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verifying Service Health

1. Direct AI Microservice Health Check:
   ```bash
   curl http://127.0.0.1:8000/health
   ```
   **Expected Response:**
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

2. Next.js Integration Health Check:
   ```bash
   curl http://localhost:3000/api/ai/health
   ```

---

## Testing Each Integrated Feature

### 1. AI-Assisted Resource Recommendations (Priority 1 & Priority 4)
- Navigate to **Discover Resources** (`/resources`).
- Click the **AI Matching Assistant** button in the header.
- Enter a project purpose (e.g. *"Need a digital storage oscilloscope for high-frequency signal debugging and logic analysis"*), specify optional technical parameters or select one of the quick presets.
- View ranked matches with:
  - Match score percentages (e.g., 94.6%).
  - Safety prerequisite verification flags (`is_eligible`).
  - Schedule availability window checks (`is_available`).
  - Expandable **Explainable AI** scoring breakdowns (TF-IDF spec similarity, capability coverage, safety eligibility score, schedule fit, campus affinity).
  - Direct links to the live apparatus detail page (`/resources/[id]`).

### 2. Underutilized Resource Detection & Bottlenecks (Priority 2)
- Sign in as an Institutional Administrator and open the **Governance Console** (`/admin`).
- Select the **AI Insights & Utilization** tab.
- Under **Utilization & Bottlenecks**, review:
  - Average platform/institutional utilization percentage.
  - Flagged underutilized assets (<20%) with actionable administrative suggestions (e.g., reducing security deposit, hosting certified student workshops, opening to partner universities).
  - Flagged capacity bottlenecks (>75% utilization or high waitlists) with mitigation suggestions.
  - Observed schedule telemetry (busiest day of week, peak demand time slot).
  - Category-level operational hours breakdown.

### 3. Ridge Regression vs Baseline Demand Forecasting (Priority 3)
- Under the **AI Insights & Utilization** tab, switch to **Demand Forecasting (ML vs Baseline)**.
- Select category or platform-wide target level and forecasting horizon (7 to 60 days).
- Compare empirical model metrics:
  - **Baseline**: 4-week Day-of-Week moving average (MAE & RMSE).
  - **ML Engine**: Scikit-learn Ridge Regression with temporal lags and calendar features (MAE, RMSE, and $R^2$ score).
- Inspect the daily forecasted demand table with predicted booked hours and confidence intervals.

---

## Running Automated Test Suites

### 1. Run Node.js Tests (Unit, Security, and Live Integration)
```bash
npm test
```
Runs all 47 tests across:
- Data privacy sanitization (verifying passwords, session tokens, and personal data are never sent to AI).
- Architectural invariants (AI recommendations cannot bypass safety prerequisites or auto-approve bookings).
- RBAC boundary enforcement (institutional data isolation).
- Fault tolerance & graceful fallback (catalog search continues if AI service is offline).
- Data sufficiency contracts (<5 bookings for utilization, <14 for forecasting).
- Live catalog revalidation against published database resources.
- Live HTTP requests against `http://127.0.0.1:8000` (`GET /health`, `POST /recommendations`, `POST /utilization-insights`, `POST /demand-forecast`, and error rejection).

### 2. Run Python Microservice Tests
```bash
# Windows
.\ai-service\venv\Scripts\pytest -v ai-service\tests

# Linux / macOS
./ai-service/venv/bin/pytest -v ai-service/tests
```
Runs all 12 Pytest tests verifying TF-IDF spec matching, schedule conflict checks, safety prerequisite gates, underutilization detection, and Ridge ML evaluation.

### 3. Run TypeScript Type Checking
```bash
npm run type-check
```

### 4. Run Production Build Validation
```bash
npm run build
```

---

## Troubleshooting & Fault Tolerance

| Symptom | Cause | Solution |
|---|---|---|
| **"AI Recommendation Service Offline"** in the discovery panel | The Python microservice process is not running on port `8000` or connection was refused. | Normal catalog discovery and search remain fully functional. Start the AI service with `uvicorn api.main:app --port 8000` and click "Retry Connection". |
| **"Insufficient Historical Operational Data" (HTTP 422)** | There are fewer than 5 booking records for utilization analysis, or fewer than 14 daily records for demand forecasting. | This is by design to prevent fabricating fake statistics. Click **"Inspect Sample Benchmark Dataset (Demo Mode)"** to inspect development benchmark metrics clearly labeled as demo data. |
| **Python wheel compilation error during `pip install`** | Python 3.14+ was used before precompiled C-extension binary wheels were published for `scikit-learn` or `scipy`. | Use Python 3.11 (`py -3.11 -m venv venv`), which downloads official precompiled wheels instantly without requiring MSVC build tools. |
| **"Authentication Required" on AI Endpoints** | An unauthenticated client called `/api/ai/recommendations` or `/api/ai/utilization`. | Sign in via `/auth/sign-in`. AI endpoints enforce session verification and institutional role checks. |
