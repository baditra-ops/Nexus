"""
Nexus AI/ML Service
Standalone microservice powering intelligent resource matching, underutilization detection,
and demand forecasting for the Nexus resource sharing platform.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.exceptions import AIServiceException, ai_service_exception_handler
from api.routes import health, recommendations, utilization, forecasting

app = FastAPI(
    title="Nexus AI/ML Service",
    version=settings.service_version,
    description=(
        "Decision-support and machine-learning intelligence microservice for the Nexus Platform.\n\n"
        "### Key Capabilities:\n"
        "- **Priority 1: Resource Matching and Recommendation Engine**: Multi-factor ranking based on TF-IDF spec similarity, "
        "safety prerequisites, schedule compatibility, and institutional affinity.\n"
        "- **Priority 2: Underutilized Resource Detection**: Detection of underused equipment and high-demand bottlenecks with actionable recommendations.\n"
        "- **Priority 3: Demand Forecasting**: Machine learning Ridge Regression vs Moving Average baseline with empirical MAE/RMSE metrics.\n"
        "- **Priority 4: Explainability**: Transparent human-readable explanations for every recommendation and forecast.\n\n"
        "**Architectural Invariant**: All eligibility, identity, and booking authorization checks are enforced by the primary Nexus backend."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handler
app.add_exception_handler(AIServiceException, ai_service_exception_handler)

# Include Routers
app.include_router(health.router)
app.include_router(recommendations.router)
app.include_router(utilization.router)
app.include_router(forecasting.router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": [
            {"method": "GET", "path": "/health", "desc": "Service health and readiness check"},
            {"method": "POST", "path": "/recommendations", "desc": "Priority 1: Multi-factor resource recommendation"},
            {"method": "POST", "path": "/utilization-insights", "desc": "Priority 2: Underutilization and bottleneck detection"},
            {"method": "POST", "path": "/demand-forecast", "desc": "Priority 3: Demand forecasting (ML vs Baseline)"},
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host=settings.host, port=settings.port, reload=True)

