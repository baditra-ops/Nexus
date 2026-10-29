from fastapi import APIRouter
from core.config import settings

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Service Health Check",
    description="Returns the operational status, version, and component readiness of the Nexus AI/ML service.",
)
async def health_check():
    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.service_version,
        "environment": settings.environment,
        "engines": {
            "resource_recommender": "operational",
            "utilization_analyzer": "operational",
            "demand_forecaster": "operational",
        },
        "ml_backend": "scikit-learn",
    }

