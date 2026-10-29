from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


SECURITY_INVARIANT_NOTICE = (
    "Nexus Architectural Invariant: Eligibility, identity verification, cross-institution permissions, "
    "and booking conflict resolution are exclusively enforced by the primary Nexus backend and institutional administrators. "
    "This AI service acts as an advisory decision-support system and never approves bookings or modifies database records directly."
)


class UserProfileInput(BaseModel):
    id: str = Field(..., description="Unique user profile UUID")
    full_name: Optional[str] = Field(None, description="Full name of user")
    institution_id: Optional[str] = Field(None, description="Home institution UUID")
    role: str = Field(default="member", description="User role: member, resource_owner, or institution_admin")
    verification_status: str = Field(default="unverified", description="unverified, pending, verified, or rejected")
    is_suspended: bool = Field(default=False, description="Whether the user is currently suspended")
    certifications: List[str] = Field(
        default_factory=list,
        description="List of verified safety trainings or credentials (e.g. ['Laser Safety Level 1', 'Cleanroom Certified'])",
    )


class AvailabilitySlotInput(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0 = Sunday, 1 = Monday, ..., 6 = Saturday")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="e.g. 09:00")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="e.g. 17:00")


class ResourceInput(BaseModel):
    id: str = Field(..., description="Unique resource UUID")
    title: str = Field(..., min_length=2, max_length=200, description="Resource name")
    description: Optional[str] = Field(None, description="Technical specifications, capabilities, and features")
    category: str = Field(..., description="Resource category (e.g. Fabrication & CNC, Optics & Imaging)")
    resource_type: str = Field(default="equipment", description="equipment, laboratory, workspace, meeting_room, etc.")
    institution_id: Optional[str] = Field(None, description="Host institution UUID")
    institution_name: Optional[str] = Field(None, description="Host institution human-readable name")
    location: Optional[str] = Field(None, description="Physical location (building, room)")
    deposit_amount: float = Field(default=0.0, ge=0.0, description="Security deposit requirement")
    currency: str = Field(default="USD", description="Currency ISO code")
    eligibility_requirements: Optional[str] = Field(None, description="Eligibility prerequisites, training requirements, or restrictions")
    usage_rules: Optional[str] = Field(None, description="Operating rules or constraints")
    status: str = Field(default="published", description="published, draft, or archived")
    availability_windows: List[AvailabilitySlotInput] = Field(
        default_factory=list,
        description="Standard operating hours / availability windows",
    )


class BookingRecordInput(BaseModel):
    id: str = Field(..., description="Booking UUID")
    resource_id: str = Field(..., description="Resource UUID")
    borrower_id: str = Field(..., description="Borrower user UUID")
    start_time: datetime = Field(..., description="Booking start timestamp (ISO 8601)")
    end_time: datetime = Field(..., description="Booking end timestamp (ISO 8601)")
    status: str = Field(
        default="approved",
        description="Booking status: requested, approved, waitlisted, checked_out, returned, completed, cancelled",
    )
    request_notes: Optional[str] = Field(None, description="Borrower notes or stated research purpose")

