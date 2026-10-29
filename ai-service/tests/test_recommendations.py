from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from api.main import app
from data.sample_data import INSTITUTION_TECHCIRCUIT_ID, INSTITUTION_METROBIO_ID

client = TestClient(app)


def test_recommendation_electronics_query():
    """Verify that an electronics prototyping query correctly ranks the digital oscilloscope first."""
    payload = {
        "purpose_description": "Need a digital storage oscilloscope for high-frequency signal debugging and logic analysis",
        "category": "Electronics & Embedded Kits",
        "required_specifications": ["4 channels", "1 GHz", "digital storage"],
        "user_profile": {
            "id": "u0000000-0000-0000-0000-000000000001",
            "full_name": "Alice Engineer",
            "institution_id": INSTITUTION_TECHCIRCUIT_ID,
            "role": "member",
            "verification_status": "verified",
            "is_suspended": False,
            "certifications": ["Electronics Safety Level 1"],
        },
        "limit": 3,
    }

    response = client.post("/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["recommendations_count"] > 0

    top_rec = data["recommendations"][0]
    assert "Keysight" in top_rec["title"] or "Oscilloscope" in top_rec["title"]
    assert top_rec["is_eligible"] is True
    assert top_rec["match_score_percentage"] > 70.0

    # Priority 4: Human-readable explainability validation
    explanation = top_rec["explanation"]
    assert "summary" in explanation
    assert len(explanation["matched_capabilities"]) > 0
    assert "safety_and_certification" in explanation
    assert "availability_assessment" in explanation
    assert "institutional_context" in explanation

    # Breakdown validation
    breakdown = top_rec["scoring_breakdown"]
    assert breakdown["overall_score"] > 0.0
    assert breakdown["spec_similarity_score"] > 0.0


def test_recommendation_missing_certification_flags_action():
    """Verify that a user missing safety certifications receives an actionable warning and reduced safety score."""
    payload = {
        "purpose_description": "High resolution Schottky field emission scanning electron microscopy for elemental mapping",
        "category": "Optics & Imaging",
        "required_specifications": ["sub-nanometer resolution", "EDS"],
        "user_profile": {
            "id": "u0000000-0000-0000-0000-000000000002",
            "full_name": "Bob Student",
            "institution_id": INSTITUTION_METROBIO_ID,
            "role": "member",
            "verification_status": "verified",
            "is_suspended": False,
            "certifications": [],  # Missing 'Electron Microscopy Core Training'
        },
        "limit": 3,
    }

    response = client.post("/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()

    top_rec = data["recommendations"][0]
    assert "FE-SEM" in top_rec["title"] or "Scanning Electron Microscope" in top_rec["title"]
    assert top_rec["is_eligible"] is False
    assert top_rec["action_required"] is not None
    assert "Prerequisite required" in top_rec["action_required"]
    assert "Electron Microscopy" in top_rec["action_required"]
    assert top_rec["scoring_breakdown"]["safety_eligibility_score"] < 0.5


def test_recommendation_schedule_conflict_detection():
    """Verify that schedule clashes with existing confirmed bookings reduce availability score."""
    start_time = datetime(2026, 11, 2, 10, 0, 0)  # Monday 10:00 AM
    end_time = datetime(2026, 11, 2, 14, 0, 0)    # Monday 02:00 PM

    payload = {
        "purpose_description": "5-axis precision CNC machining for titanium aerospace brackets",
        "category": "Fabrication & CNC",
        "required_specifications": ["5-axis", "titanium"],
        "user_profile": {
            "id": "u0000000-0000-0000-0000-000000000003",
            "full_name": "Charlie Maker",
            "institution_id": INSTITUTION_TECHCIRCUIT_ID,
            "role": "member",
            "verification_status": "verified",
            "is_suspended": False,
            "certifications": ["CNC Machining Certification"],
        },
        "requested_start_time": start_time.isoformat(),
        "requested_end_time": end_time.isoformat(),
        "existing_bookings": [
            {
                "id": "b0000000-0000-0000-0000-999999999999",
                "resource_id": "r0000000-0000-0000-0000-000000000001",  # Haas CNC
                "borrower_id": "u0000000-0000-0000-0000-888888888888",
                "start_time": (start_time + timedelta(hours=1)).isoformat(),  # Clashing: 11:00 - 13:00
                "end_time": (start_time + timedelta(hours=3)).isoformat(),
                "status": "approved",
                "request_notes": "Existing confirmed reservation",
            }
        ],
        "limit": 2,
    }

    response = client.post("/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()

    top_rec = data["recommendations"][0]
    assert top_rec["is_available"] is False
    assert top_rec["scoring_breakdown"]["availability_score"] < 0.20
    assert "conflict" in top_rec["action_required"].lower()


def test_recommendation_suspended_user_status_notice():
    """Verify that suspended users receive clear status notice without crashing."""
    payload = {
        "purpose_description": "3D resin printing for microfluidic housings",
        "required_specifications": ["SLA", "resin"],
        "user_profile": {
            "id": "u0000000-0000-0000-0000-000000000004",
            "full_name": "Suspended User",
            "institution_id": INSTITUTION_TECHCIRCUIT_ID,
            "role": "member",
            "verification_status": "verified",
            "is_suspended": True,
            "certifications": [],
        },
        "limit": 2,
    }

    response = client.post("/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user_status_notice"] is not None
    assert "suspended" in data["user_status_notice"].lower()
    for rec in data["recommendations"]:
        assert rec["is_eligible"] is False
        assert "suspended" in (rec["action_required"] or "").lower()

