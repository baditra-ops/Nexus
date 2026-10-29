from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from api.schemas.common import (
    ResourceInput,
    UserProfileInput,
    BookingRecordInput,
    SECURITY_INVARIANT_NOTICE,
)


class RecommendationRequest(BaseModel):
    purpose_description: str = Field(
        ...,
        min_length=3,
        description="Intended project or research purpose (e.g. 'Fabricating high-precision titanium enclosure brackets for aerospace payload')",
    )
    category: Optional[str] = Field(None, description="Optional target category filter")
    required_specifications: List[str] = Field(
        default_factory=list,
        description="Explicit technical requirements (e.g. ['5-axis CNC', 'Coolant flood system', 'Aluminum & titanium compatible'])",
    )
    user_profile: UserProfileInput = Field(..., description="Context of the requesting user")
    requested_start_time: Optional[datetime] = Field(
        None, description="Desired start timestamp for resource access (ISO 8601)"
    )
    requested_end_time: Optional[datetime] = Field(
        None, description="Desired end timestamp for resource access (ISO 8601)"
    )
    max_deposit: Optional[float] = Field(None, ge=0.0, description="Maximum security deposit user is willing to authorize")
    preferred_location: Optional[str] = Field(None, description="Preferred campus, building, or city")
    preferred_institution_id: Optional[str] = Field(None, description="Specific target institution UUID")
    cross_institution_allowed: bool = Field(
        default=True, description="Whether to include resources from partner institutions"
    )
    candidate_resources: Optional[List[ResourceInput]] = Field(
        None, description="Resource catalog subset to evaluate. If empty or None, platform catalog is evaluated."
    )
    existing_bookings: Optional[List[BookingRecordInput]] = Field(
        None, description="Current bookings on candidate resources for calendar conflict checking"
    )
    limit: int = Field(default=5, ge=1, le=50, description="Maximum number of recommendations to return")


class MatchExplanation(BaseModel):
    summary: str = Field(..., description="High-level human-readable justification for this recommendation")
    matched_capabilities: List[str] = Field(
        default_factory=list, description="Specific technical specifications that aligned with user requirements"
    )
    unmatched_specifications: List[str] = Field(
        default_factory=list, description="User requirements that were not clearly found in the resource listing"
    )
    eligibility_assessment: str = Field(..., description="Institutional access, verification, and suspension status check")
    safety_and_certification: str = Field(..., description="Analysis of required safety trainings vs user certifications")
    availability_assessment: str = Field(..., description="Operating hours and calendar conflict check")
    institutional_context: str = Field(..., description="Home institution vs cross-institutional partner terms")


class ScoringBreakdown(BaseModel):
    spec_similarity_score: float = Field(..., ge=0.0, le=1.0, description="TF-IDF cosine similarity on purpose description")
    capability_coverage_score: float = Field(..., ge=0.0, le=1.0, description="Proportion of explicit specifications matched")
    safety_eligibility_score: float = Field(..., ge=0.0, le=1.0, description="Eligibility & safety prerequisites score")
    availability_score: float = Field(..., ge=0.0, le=1.0, description="Schedule availability and conflict score")
    institution_affinity_score: float = Field(..., ge=0.0, le=1.0, description="Home vs partner institution score")
    overall_score: float = Field(..., ge=0.0, le=1.0, description="Composite weighted ranking score")


class ResourceRecommendationItem(BaseModel):
    resource_id: str
    title: str
    category: str
    resource_type: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    location: Optional[str] = None
    deposit_amount: float
    currency: str = "USD"
    match_score_percentage: float = Field(..., description="Score scaled from 0% to 100%")
    is_eligible: bool = Field(..., description="Whether user currently meets prerequisite criteria")
    is_available: bool = Field(..., description="Whether requested schedule slot is conflict-free")
    action_required: Optional[str] = Field(
        None, description="Clear prompt if user needs verification, training, or deposit approval before booking"
    )
    explanation: MatchExplanation
    scoring_breakdown: ScoringBreakdown


class RecommendationResponse(BaseModel):
    success: bool = True
    total_candidates_analyzed: int
    recommendations_count: int
    user_status_notice: Optional[str] = None
    architectural_notice: str = SECURITY_INVARIANT_NOTICE
    recommendations: List[ResourceRecommendationItem]

