from fastapi import APIRouter, HTTPException
from api.schemas.recommendation_schemas import RecommendationRequest, RecommendationResponse
from engine.recommender import ResourceRecommender

router = APIRouter(tags=["Recommendations"])
recommender = ResourceRecommender()


@router.post(
    "/recommendations",
    response_model=RecommendationResponse,
    summary="Priority 1: Resource Matching and Recommendation Engine",
    description=(
        "Analyzes user project purpose, explicit technical specifications, safety credentials, "
        "institutional affiliation, and schedule availability windows to recommend and rank optimal resources. "
        "Includes full transparent, human-readable explanations (Priority 4). "
        "Nexus invariant: Never bypasses backend eligibility or booking approvals."
    ),
)
async def get_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    try:
        response = recommender.recommend(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")

