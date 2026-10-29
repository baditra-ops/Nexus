"""
Resource Matching and Recommendation Engine (Priority 1 & Priority 4)

Combines:
1. TF-IDF vectorization and cosine similarity over unstructured descriptions & technical specs
2. Keyword & capability coverage analysis
3. Institutional affiliation & cross-institutional access policies
4. Availability window and schedule conflict checking
5. Safety, training, and prerequisite credential verification
6. Human-readable, transparent explainability for every recommendation

Important Architectural Invariant:
Eligibility, identity verification, access authorization, and final booking approval
must be verified by the primary Nexus backend and institutional administrators.
This engine acts as a ranking advisory system and never approves bookings or modifies records.
"""

import re
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from api.schemas.common import (
    ResourceInput,
    UserProfileInput,
    BookingRecordInput,
    SECURITY_INVARIANT_NOTICE,
)
from api.schemas.recommendation_schemas import (
    RecommendationRequest,
    RecommendationResponse,
    ResourceRecommendationItem,
    MatchExplanation,
    ScoringBreakdown,
)
from data.sample_data import SAMPLE_RESOURCES

# Distinctive keyword phrases mapped to specific certifications
CERTIFICATION_SIGNATURES: Dict[str, List[str]] = {
    "CNC Machining Certification": ["cnc machining", "cnc certification"],
    "Electronics Safety Level 1": ["electronics safety"],
    "Cleanroom Gowning & Safety Certification Level 2": ["cleanroom gowning", "cleanroom certification"],
    "Biosafety Level 1": ["biosafety level 1", "bsl-1", "bsl 1"],
    "Biosafety Level 2": ["biosafety level 2", "bsl-2", "bsl 2"],
    "Chemical Hygiene & Biosafety Level 2 Certification": ["chemical hygiene"],
    "Electron Microscopy Core Training": ["electron microscopy", "microscopy core training"],
    "Materials Testing Lab Safety Certification": ["materials testing", "testing lab safety"],
    "Laser Safety Level 1": ["laser safety"],
    "Makerspace Rapid Prototyping Orientation": ["rapid prototyping orientation", "makerspace orientation"],
}


class ResourceRecommender:
    """Intelligent multi-factor recommendation engine with explainable AI."""

    def __init__(self, default_catalog: Optional[List[ResourceInput]] = None):
        self.default_catalog = default_catalog or SAMPLE_RESOURCES

    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        candidates = request.candidate_resources if request.candidate_resources is not None else self.default_catalog
        existing_bookings = request.existing_bookings or []

        # Filter out unpublished resources
        active_candidates = [
            r for r in candidates if r.status == "published"
        ]

        # Respect category filter if provided
        if request.category:
            cat_lower = request.category.strip().lower()
            matching_cat = [r for r in active_candidates if cat_lower in r.category.lower()]
            if matching_cat:
                active_candidates = matching_cat

        # Respect cross-institution preference
        user_inst = request.user_profile.institution_id
        if not request.cross_institution_allowed and user_inst:
            active_candidates = [
                r for r in active_candidates if r.institution_id == user_inst
            ]

        if not active_candidates:
            return RecommendationResponse(
                success=True,
                total_candidates_analyzed=0,
                recommendations_count=0,
                user_status_notice=self._check_user_suspension_status(request.user_profile),
                recommendations=[],
            )

        # 1. Compute Semantic & Specification Similarity via TF-IDF
        query_text = f"{request.purpose_description} {' '.join(request.required_specifications)}"
        if request.category:
            query_text += f" {request.category}"

        resource_texts = [
            f"{r.title} {r.category} {r.resource_type} {r.description or ''} {r.usage_rules or ''} {r.eligibility_requirements or ''}"
            for r in active_candidates
        ]

        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
        )
        try:
            tfidf_matrix = vectorizer.fit_transform([query_text] + resource_texts)
            cosine_sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
        except Exception:
            cosine_sims = [0.1] * len(active_candidates)

        scored_items: List[ResourceRecommendationItem] = []

        for idx, resource in enumerate(active_candidates):
            sim_score = float(cosine_sims[idx])

            # 2. Capability coverage analysis
            matched_caps, unmatched_specs, cap_score = self._evaluate_capability_coverage(
                request.required_specifications, resource
            )

            # Combined specification score (55% TF-IDF cosine similarity, 45% explicit spec match)
            if request.required_specifications:
                spec_score = 0.55 * sim_score + 0.45 * cap_score
            else:
                spec_score = sim_score

            # 3. Safety and Training compatibility
            is_safety_eligible, safety_score, safety_text, missing_certs = self._evaluate_safety_and_credentials(
                resource, request.user_profile
            )

            # 4. Schedule & Availability evaluation
            is_available, avail_score, avail_text = self._evaluate_schedule_and_conflicts(
                resource,
                request.requested_start_time,
                request.requested_end_time,
                existing_bookings,
            )

            # 5. Institutional affinity & preference score
            inst_score, inst_text = self._evaluate_institutional_affinity(
                resource,
                request.user_profile,
                request.preferred_institution_id,
                request.preferred_location,
            )

            # 6. Deposit budget check
            deposit_penalty = 0.0
            if request.max_deposit is not None and resource.deposit_amount > request.max_deposit:
                deposit_penalty = min(0.20, (resource.deposit_amount - request.max_deposit) / (resource.deposit_amount + 1) * 0.20)

            # 7. Composite Weighted Score
            composite_score = (
                0.40 * spec_score +
                0.25 * avail_score +
                0.20 * safety_score +
                0.15 * inst_score -
                deposit_penalty
            )
            composite_score = max(0.01, min(1.0, composite_score))
            score_percentage = round(composite_score * 100, 1)

            # 8. User eligibility check
            is_user_suspended = request.user_profile.is_suspended
            is_user_verified = request.user_profile.verification_status == "verified"
            is_overall_eligible = (not is_user_suspended) and is_safety_eligible

            # 9. Generate Human-Readable Action Required prompt
            action_required = None
            if is_user_suspended:
                action_required = "Account is suspended. Institutional administrator review required before booking."
            elif not is_user_verified:
                action_required = "User institutional verification pending. Contact institution admin for verification."
            elif not is_available:
                action_required = "Requested time slot conflicts with an existing booking or is outside operating hours. Please select another slot."
            elif missing_certs:
                action_required = f"Prerequisite required: Complete {', '.join(missing_certs)} before requesting checkout."
            elif request.max_deposit is not None and resource.deposit_amount > request.max_deposit:
                action_required = f"Deposit required (${resource.deposit_amount:,.2f}) exceeds requested budget limit (${request.max_deposit:,.2f})."

            # 10. Generate Transparent Human Explanation (Priority 4)
            explanation = self._generate_explanation(
                resource=resource,
                score_percentage=score_percentage,
                matched_caps=matched_caps,
                unmatched_specs=unmatched_specs,
                user_profile=request.user_profile,
                safety_text=safety_text,
                avail_text=avail_text,
                inst_text=inst_text,
                is_eligible=is_overall_eligible,
                missing_certs=missing_certs,
            )

            scoring_breakdown = ScoringBreakdown(
                spec_similarity_score=round(sim_score, 3),
                capability_coverage_score=round(cap_score, 3),
                safety_eligibility_score=round(safety_score, 3),
                availability_score=round(avail_score, 3),
                institution_affinity_score=round(inst_score, 3),
                overall_score=round(composite_score, 3),
            )

            scored_items.append(
                ResourceRecommendationItem(
                    resource_id=resource.id,
                    title=resource.title,
                    category=resource.category,
                    resource_type=resource.resource_type,
                    institution_id=resource.institution_id,
                    institution_name=resource.institution_name,
                    location=resource.location,
                    deposit_amount=resource.deposit_amount,
                    currency=resource.currency,
                    match_score_percentage=score_percentage,
                    is_eligible=is_overall_eligible,
                    is_available=is_available,
                    action_required=action_required,
                    explanation=explanation,
                    scoring_breakdown=scoring_breakdown,
                )
            )

        # Sort recommendations: highest composite match score first
        scored_items.sort(key=lambda item: item.scoring_breakdown.overall_score, reverse=True)
        top_recommendations = scored_items[: request.limit]

        return RecommendationResponse(
            success=True,
            total_candidates_analyzed=len(active_candidates),
            recommendations_count=len(top_recommendations),
            user_status_notice=self._check_user_suspension_status(request.user_profile),
            architectural_notice=SECURITY_INVARIANT_NOTICE,
            recommendations=top_recommendations,
        )

    def _evaluate_capability_coverage(
        self, required_specs: List[str], resource: ResourceInput
    ) -> Tuple[List[str], List[str], float]:
        """Checks which required specifications are present in resource metadata."""
        if not required_specs:
            return [], [], 1.0

        search_blob = f"{resource.title} {resource.description or ''} {resource.usage_rules or ''}".lower()
        matched = []
        unmatched = []

        for spec in required_specs:
            spec_clean = spec.strip().lower()
            tokens = [t for t in re.split(r"\W+", spec_clean) if len(t) > 2]
            if spec_clean in search_blob:
                matched.append(spec)
            elif tokens and all(token in search_blob for token in tokens):
                matched.append(spec)
            else:
                unmatched.append(spec)

        coverage_ratio = len(matched) / len(required_specs) if required_specs else 1.0
        return matched, unmatched, coverage_ratio

    def _evaluate_safety_and_credentials(
        self, resource: ResourceInput, user_profile: UserProfileInput
    ) -> Tuple[bool, float, str, List[str]]:
        """Evaluates prerequisites and safety requirements against user certifications."""
        req_text = (resource.eligibility_requirements or "").lower()
        user_certs_lower = [c.lower() for c in user_profile.certifications]

        required_certs_found: List[str] = []
        for cert_name, signatures in CERTIFICATION_SIGNATURES.items():
            if any(sig in req_text for sig in signatures):
                required_certs_found.append(cert_name)

        if not required_certs_found:
            return True, 1.0, "No specialized safety certifications required for standard access.", []

        missing_certs = []
        for req_cert in required_certs_found:
            user_has = any(
                req_cert.lower() in u_cert
                or any(sig in u_cert for sig in CERTIFICATION_SIGNATURES.get(req_cert, []))
                for u_cert in user_certs_lower
            )
            if not user_has:
                missing_certs.append(req_cert)

        if not missing_certs:
            return True, 1.0, f"User possesses verified prerequisites: {', '.join(required_certs_found)}.", []
        else:
            return (
                False,
                0.35,
                f"Missing required certifications: {', '.join(missing_certs)}. Required by safety policy.",
                missing_certs,
            )

    def _evaluate_schedule_and_conflicts(
        self,
        resource: ResourceInput,
        start_dt: Optional[datetime],
        end_dt: Optional[datetime],
        existing_bookings: List[BookingRecordInput],
    ) -> Tuple[bool, float, str]:
        """Checks if requested date and time fits availability windows and is free of booking conflicts."""
        if not start_dt or not end_dt:
            return True, 1.0, "Flexible schedule. Ready for on-demand booking window reservation."

        req_day = start_dt.weekday()  # Monday = 0 in Python
        nexus_day = (req_day + 1) % 7

        req_start_str = start_dt.strftime("%H:%M")
        req_end_str = end_dt.strftime("%H:%M")

        is_within_hours = False
        if not resource.availability_windows:
            is_within_hours = True
        else:
            for win in resource.availability_windows:
                if win.day_of_week == nexus_day:
                    if win.start_time <= req_start_str and win.end_time >= req_end_str:
                        is_within_hours = True
                        break

        if not is_within_hours:
            return (
                False,
                0.25,
                f"Requested slot ({start_dt.strftime('%A %H:%M')}-{end_dt.strftime('%H:%M')}) is outside standard operational availability windows.",
            )

        # Check booking calendar clashes
        for booking in existing_bookings:
            if booking.resource_id == resource.id and booking.status in ["approved", "checked_out", "requested"]:
                b_start = booking.start_time.replace(tzinfo=None) if booking.start_time.tzinfo else booking.start_time
                b_end = booking.end_time.replace(tzinfo=None) if booking.end_time.tzinfo else booking.end_time
                s_dt = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt
                e_dt = end_dt.replace(tzinfo=None) if end_dt.tzinfo else end_dt

                if not (e_dt <= b_start or s_dt >= b_end):
                    return (
                        False,
                        0.10,
                        f"Booking conflict detected with active reservation #{booking.id[:8]} ({b_start.strftime('%b %d %H:%M')}-{b_end.strftime('%H:%M')}).",
                    )

        return (
            True,
            1.0,
            f"Available and conflict-free for requested period: {start_dt.strftime('%a, %b %d %H:%M')} to {end_dt.strftime('%H:%M')}.",
        )

    def _evaluate_institutional_affinity(
        self,
        resource: ResourceInput,
        user_profile: UserProfileInput,
        preferred_inst_id: Optional[str],
        preferred_loc: Optional[str],
    ) -> Tuple[float, str]:
        """Scores institutional proximity and partnership agreements."""
        is_same_institution = (
            user_profile.institution_id is not None
            and resource.institution_id == user_profile.institution_id
        )

        if is_same_institution:
            return 1.0, f"Located at user's home institution ({resource.institution_name or 'Home Campus'}). Highest booking priority."

        if preferred_inst_id and resource.institution_id == preferred_inst_id:
            return 0.90, f"Matches requested target institution ({resource.institution_name})."

        if preferred_loc and resource.location and preferred_loc.lower() in resource.location.lower():
            return 0.85, f"Matches preferred campus location: {resource.location}."

        return 0.70, f"Cross-institutional shared resource from partner institution ({resource.institution_name or 'Affiliate'})."

    def _generate_explanation(
        self,
        resource: ResourceInput,
        score_percentage: float,
        matched_caps: List[str],
        unmatched_specs: List[str],
        user_profile: UserProfileInput,
        safety_text: str,
        avail_text: str,
        inst_text: str,
        is_eligible: bool,
        missing_certs: List[str],
    ) -> MatchExplanation:
        """Constructs human-readable, non-penalizing explanation for the recommendation."""
        matched_summary = f"{len(matched_caps)} specifications matched" if matched_caps else "Strong semantic relevance"
        summary = (
            f"Match Score: {score_percentage}%. {resource.title} aligns with intended research purpose. "
            f"{matched_summary}. {inst_text}"
        )

        eligibility_assessment = (
            "User verification is in good standing."
            if user_profile.verification_status == "verified"
            else f"User status is currently '{user_profile.verification_status}'. Final access requires verified status."
        )
        if user_profile.is_suspended:
            eligibility_assessment = "Notice: Account is currently suspended under institutional fair-use rules."

        return MatchExplanation(
            summary=summary,
            matched_capabilities=matched_caps,
            unmatched_specifications=unmatched_specs,
            eligibility_assessment=eligibility_assessment,
            safety_and_certification=safety_text,
            availability_assessment=avail_text,
            institutional_context=inst_text,
        )

    def _check_user_suspension_status(self, user: UserProfileInput) -> Optional[str]:
        if user.is_suspended:
            return "User account is suspended. Recommendations are shown for planning purposes only; active bookings cannot be created."
        if user.verification_status != "verified":
            return f"User verification status is '{user.verification_status}'. An institutional admin must verify credentials for unhindered booking authorization."
        return None
