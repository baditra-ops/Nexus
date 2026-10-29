"""
Nexus Platform Sample Dataset.
Matches the official database schema from Supabase migrations:
- Institutions: TechCircuit, Metropolitan Bioengineering, Apex Makerspace
- Categories: Fabrication & CNC, Optics & Imaging, Electronics & Embedded Kits,
              Analytical & Testing, Cleanrooms & Specialized Spaces, Biochemical & Life Sciences
"""

from datetime import datetime, timedelta
from typing import List
from api.schemas.common import (
    ResourceInput,
    AvailabilitySlotInput,
    BookingRecordInput,
    UserProfileInput,
)

INSTITUTION_TECHCIRCUIT_ID = "a0000000-0000-0000-0000-000000000001"
INSTITUTION_METROBIO_ID = "a0000000-0000-0000-0000-000000000002"
INSTITUTION_APEX_ID = "a0000000-0000-0000-0000-000000000003"

STANDARD_WEEKDAY_AVAILABILITY = [
    AvailabilitySlotInput(day_of_week=i, start_time="09:00", end_time="17:00")
    for i in range(1, 6)  # Mon-Fri
]

SAMPLE_RESOURCES: List[ResourceInput] = [
    ResourceInput(
        id="r0000000-0000-0000-0000-000000000001",
        title="Haas VF-2SS 5-Axis High-Speed CNC Machining Center",
        category="Fabrication & CNC",
        resource_type="equipment",
        institution_id=INSTITUTION_TECHCIRCUIT_ID,
        institution_name="TechCircuit Institute of Technology",
        location="Building 4, Central Fabrication Wing, Bay 102",
        deposit_amount=150.0,
        currency="USD",
        description=(
            "High-precision 5-axis vertical machining center with 12,000 RPM spindle, "
            "rigid tapping, 30+1 tool changer, and high-pressure flood coolant. "
            "Capable of precision milling for aerospace alloys, titanium, aluminum, and engineering plastics."
        ),
        eligibility_requirements="Requires Advanced CNC Machining Certification and verified institutional membership.",
        usage_rules="Safety glasses, steel-toed boots mandatory. Machine must be deburred and chip tray emptied after session.",
        status="published",
        availability_windows=STANDARD_WEEKDAY_AVAILABILITY,
    ),
    ResourceInput(
        id="r0000000-0000-0000-0000-000000000002",
        title="Keysight Infiniium 4-Channel 1GHz Digital Storage Oscilloscope",
        category="Electronics & Embedded Kits",
        resource_type="equipment",
        institution_id=INSTITUTION_TECHCIRCUIT_ID,
        institution_name="TechCircuit Institute of Technology",
        location="Building 4, Electronics Prototyping Lab, Bench 7",
        deposit_amount=50.0,
        currency="USD",
        description=(
            "4 analog channels, 1 GHz bandwidth, 5 GSa/s sample rate, 16 digital logic timing channels. "
            "Includes active differential probes, I2C/SPI/CAN protocol decoder, and frequency response analysis."
        ),
        eligibility_requirements="Requires Electronics Safety Level 1 and verified student or faculty status.",
        usage_rules="Calibrate probe grounding before high-frequency RF measurements. Do not exceed 50V input.",
        status="published",
        availability_windows=STANDARD_WEEKDAY_AVAILABILITY,
    ),
    ResourceInput(
        id="r0000000-0000-0000-0000-000000000003",
        title="JEOL JSM-IT800 Field Emission Scanning Electron Microscope (FE-SEM)",
        category="Optics & Imaging",
        resource_type="equipment",
        institution_id=INSTITUTION_METROBIO_ID,
        institution_name="Metropolitan Bioengineering Laboratory",
        location="West Campus, Life Sciences Center, Imaging Core B04",
        deposit_amount=200.0,
        currency="USD",
        description=(
            "Ultra-high resolution Schottky field emission SEM (sub-nanometer resolution at 15kV). "
            "Equipped with Oxford Instruments EDS for elemental composition mapping and low-vacuum mode for biological samples."
        ),
        eligibility_requirements="Requires Electron Microscopy Core Training and certified radiation/electron safety course.",
        usage_rules="All specimens must be desiccated and plasma-cleaned prior to chamber insertion.",
        status="published",
        availability_windows=STANDARD_WEEKDAY_AVAILABILITY,
    ),
    ResourceInput(
        id="r0000000-0000-0000-0000-000000000004",
        title="Olympus BX53 Upright Fluorescence Microscope with CMOS Camera",
        category="Optics & Imaging",
        resource_type="equipment",
        institution_id=INSTITUTION_METROBIO_ID,
        institution_name="Metropolitan Bioengineering Laboratory",
        location="West Campus, Life Sciences Center, Room 312",
        deposit_amount=50.0,
        currency="USD",
        description=(
            "Research upright microscope featuring 8-position fluorescence mirror turret (DAPI, FITC, TRITC, Cy5 filters), "
            "Plan Apochromat 10x, 20x, 40x, 100x oil objectives, and 20MP color cooled CMOS imaging sensor."
        ),
        eligibility_requirements="Requires Biosafety Level 1 and standard microscopy orientation.",
        usage_rules="Lens immersion oil must be cleaned with optical lens paper after every session.",
        status="published",
        availability_windows=STANDARD_WEEKDAY_AVAILABILITY,
    ),
    ResourceInput(
        id="r0000000-0000-0000-0000-000000000005",
        title="Class 1000 ISO 6 Cleanroom Photolithography & Etch Bay",
        category="Cleanrooms & Specialized Spaces",
        resource_type="laboratory",
        institution_id=INSTITUTION_TECHCIRCUIT_ID,
        institution_name="TechCircuit Institute of Technology",
        location="Science Park, Microelectronics Cleanroom Complex, Bay 3",
        deposit_amount=300.0,
        currency="USD",
        description=(
            "ISO 6 certified cleanroom bay with Karl Suss mask aligner, spin coater, convection soft-bake ovens, "
            "and wet chemical fume hood for developer and solvent rinses. Suitable for MEMS and microfluidics fabrication."
        ),
        eligibility_requirements="Requires Cleanroom Gowning & Safety Certification Level 2 and hazard protocol sign-off.",
        usage_rules="Full bunny suit gowning, safety glasses, and nitrile gloves required at all times.",
        status="published",
        availability_windows=STANDARD_WEEKDAY_AVAILABILITY,
    ),
    ResourceInput(
        id="r0000000-0000-0000-0000-000000000006",
        title="Formlabs Form 4 SLA Stereolithography 3D Resin Printer",
        category="Fabrication & CNC",
        resource_type="equipment",
        institution_id=INSTITUTION_APEX_ID,
        institution_name="Apex Community Makerspace & Prototyping Center",
        location="Downtown Makerspace, Rapid Prototyping Floor, Bench 2",
        deposit_amount=25.0,
        currency="USD",
        description=(
            "Industrial 3D resin printer with 50-micron laser spot, 250 x 200 x 300 mm build volume. "
            "Supports Tough 2000, Rigid 10K, Clear, and Castable wax resins for micro-fluidic chips and structural housings."
        ),
        eligibility_requirements="Requires Makerspace Rapid Prototyping Orientation.",
        usage_rules="Wear nitrile gloves when handling uncured photopolymer resin. Dispose IPA waste in designated carboys.",
        status="published",
        availability_windows=STANDARD_WEEKDAY_AVAILABILITY,
    ),
    ResourceInput(
        id="r0000000-0000-0000-0000-000000000007",
        title="Instron 5969 Dual-Column Universal Mechanical Testing System",
        category="Analytical & Testing",
        resource_type="equipment",
        institution_id=INSTITUTION_APEX_ID,
        institution_name="Apex Community Makerspace & Prototyping Center",
        location="Downtown Makerspace, Materials Testing Suite, Bay 4",
        deposit_amount=100.0,
        currency="USD",
        description=(
            "50 kN capacity electromechanical load frame for tensile, compression, flexure, and shear testing. "
            "Bluehill Universal software suite with automatic extensometer data acquisition."
        ),
        eligibility_requirements="Requires Materials Testing Lab Safety Certification.",
        usage_rules="Verify emergency stop clearance before initiating tension ramp tests.",
        status="published",
        availability_windows=STANDARD_WEEKDAY_AVAILABILITY,
    ),
    ResourceInput(
        id="r0000000-0000-0000-0000-000000000008",
        title="Agilent 1260 Infinity II HPLC Liquid Chromatography System",
        category="Biochemical & Life Sciences",
        resource_type="equipment",
        institution_id=INSTITUTION_METROBIO_ID,
        institution_name="Metropolitan Bioengineering Laboratory",
        location="West Campus, Analytical Chemistry Core, Lab 208",
        deposit_amount=120.0,
        currency="USD",
        description=(
            "Quaternary pump HPLC system with diode array detector (DAD) and autosampler for biomolecule separation, "
            "purity profiling, and peptide quantification."
        ),
        eligibility_requirements="Requires Chemical Hygiene & Biosafety Level 2 Certification.",
        usage_rules="Flush columns with 80/20 methanol/water after reverse-phase analysis.",
        status="published",
        availability_windows=STANDARD_WEEKDAY_AVAILABILITY,
    ),
]


def generate_sample_historical_bookings(reference_date: datetime = None) -> List[BookingRecordInput]:
    """
    Generates 60+ realistic historical booking records over the past 45 days.
    Simulates:
    - High-demand resources (Haas CNC, FE-SEM): 80%+ utilization, waitlisted/clashes
    - Underutilized resources (Cleanroom Bay, Instron tester): <15% utilization
    - Balanced resources (Keysight scope, Olympus microscope): 30-50% utilization
    """
    if reference_date is None:
        reference_date = datetime.now()

    bookings: List[BookingRecordInput] = []
    booking_id_counter = 1

    # Define resource historical activity profile (utilization archetype)
    resource_profiles = [
        # High demand: Haas CNC
        {"id": "r0000000-0000-0000-0000-000000000001", "freq": 0.85, "hours": [9, 13], "waitlist_rate": 0.15},
        # Balanced: Keysight Oscilloscope
        {"id": "r0000000-0000-0000-0000-000000000002", "freq": 0.45, "hours": [10, 14], "waitlist_rate": 0.05},
        # High demand: FE-SEM
        {"id": "r0000000-0000-0000-0000-000000000003", "freq": 0.80, "hours": [9, 14], "waitlist_rate": 0.20},
        # Balanced: Olympus Microscope
        {"id": "r0000000-0000-0000-0000-000000000004", "freq": 0.40, "hours": [11, 15], "waitlist_rate": 0.02},
        # UNDERUTILIZED: Cleanroom Bay (<10% utilization)
        {"id": "r0000000-0000-0000-0000-000000000005", "freq": 0.08, "hours": [13], "waitlist_rate": 0.0},
        # Balanced / active: Formlabs 3D Printer
        {"id": "r0000000-0000-0000-0000-000000000006", "freq": 0.50, "hours": [10, 14], "waitlist_rate": 0.08},
        # UNDERUTILIZED: Instron Mechanical Tester (<12% utilization)
        {"id": "r0000000-0000-0000-0000-000000000007", "freq": 0.10, "hours": [14], "waitlist_rate": 0.0},
        # Balanced: HPLC System
        {"id": "r0000000-0000-0000-0000-000000000008", "freq": 0.35, "hours": [10, 13], "waitlist_rate": 0.05},
    ]

    for day_offset in range(45, 0, -1):
        day = reference_date - timedelta(days=day_offset)
        # Skip weekends for regular university academic schedule
        if day.weekday() >= 5:
            continue

        for profile in resource_profiles:
            # Deterministic pseudo-random generation based on day and resource
            hash_val = ((day_offset * 17) + int(profile["id"][-1]) * 23) % 100
            if hash_val < int(profile["freq"] * 100):
                for start_hour in profile["hours"]:
                    # Create booking (3 hours duration)
                    start_dt = day.replace(hour=start_hour, minute=0, second=0, microsecond=0)
                    end_dt = start_dt + timedelta(hours=3)

                    # Determine status
                    is_waitlisted = ((hash_val * 7) % 100) < int(profile["waitlist_rate"] * 100)
                    status = "waitlisted" if is_waitlisted else "completed"

                    bookings.append(
                        BookingRecordInput(
                            id=f"b0000000-0000-0000-0000-{booking_id_counter:012d}",
                            resource_id=profile["id"],
                            borrower_id=f"u0000000-0000-0000-0000-{(booking_id_counter % 5) + 1:012d}",
                            start_time=start_dt,
                            end_time=end_dt,
                            status=status,
                            request_notes=f"Academic research session #{booking_id_counter}",
                        )
                    )
                    booking_id_counter += 1

    return bookings


SAMPLE_BOOKINGS: List[BookingRecordInput] = generate_sample_historical_bookings()

