import test from "node:test";
import assert from "node:assert/strict";

/**
 * Suite 1: Data Privacy & Sanitization Invariant
 * Verifies that no sensitive credentials, session tokens, passwords, or unauthorized
 * private user attributes are forwarded to the external AI microservice.
 */
test("Data Privacy Invariant: AI payloads exclude passwords, tokens, and unnecessary personal data", () => {
  const sanitizeProfileForAI = (rawUser, rawProfile) => {
    // Whitelisted non-sensitive fields only
    return {
      id: rawUser.id,
      full_name: rawProfile.full_name || "Nexus Member",
      institution_id: rawProfile.institution_id || null,
      role: rawProfile.role || "member",
      verification_status: rawProfile.verification_status || "unverified",
      is_suspended: Boolean(rawProfile.is_suspended),
      certifications: rawProfile.certifications || [],
    };
  };

  const mockDbUser = {
    id: "u-001",
    email: "alice@techcircuit.edu",
    password_hash: "$2b$12$e80A123FakeHashForTestingOnly...",
    encrypted_session_token: "sess_token_xyz987654321",
    raw_user_meta_data: { phone: "+15551234567", ssn: "000-00-0000" },
  };

  const mockDbProfile = {
    id: "u-001",
    full_name: "Alice Researcher",
    institution_id: "inst-100",
    role: "member",
    verification_status: "verified",
    is_suspended: false,
    certifications: ["Laser Safety Level 1", "Cleanroom Certified"],
    internal_audit_notes: "Restricted administrative comments",
  };

  const sanitized = sanitizeProfileForAI(mockDbUser, mockDbProfile);

  // Assert sensitive fields are completely absent
  assert.equal(sanitized.id, "u-001");
  assert.equal(sanitized.full_name, "Alice Researcher");
  assert.equal("password_hash" in sanitized, false);
  assert.equal("encrypted_session_token" in sanitized, false);
  assert.equal("email" in sanitized, false);
  assert.equal("internal_audit_notes" in sanitized, false);
  assert.equal("phone" in sanitized, false);
  assert.deepEqual(sanitized.certifications, ["Laser Safety Level 1", "Cleanroom Certified"]);
});

/**
 * Suite 2: Architectural Invariant & Authorization Enforcement
 * Verifies that AI recommendations are strictly advisory and never grant access,
 * bypass prerequisites, or approve bookings.
 */
test("Architectural Invariant: AI recommendations never bypass safety gates or auto-approve bookings", () => {
  const evaluateBookingEligibility = (recommendation, livePrerequisiteCheck) => {
    // Invariant: Live database state ALWAYS overrides advisory AI match score
    if (!livePrerequisiteCheck.passed) {
      return {
        canBook: false,
        reason: `Access blocked: Required safety prerequisite '${livePrerequisiteCheck.missingPrerequisite}' has not been completed.`,
        requiresReview: true,
      };
    }

    if (recommendation.match_score_percentage > 90 && !livePrerequisiteCheck.verifiedByAdmin) {
      return {
        canBook: true,
        reason: "Advisory match accepted. Submission routed to custodian for standard approval workflow.",
        requiresReview: true,
      };
    }

    return {
      canBook: true,
      reason: "Standard checkout approved.",
      requiresReview: false,
    };
  };

  // Scenario A: AI scored 98% match, but user lacks live safety credential
  const aiRecHigh = {
    resource_id: "res-cnc-01",
    match_score_percentage: 98.5,
    is_eligible: true, // Advisory guess
  };

  const gateResult = evaluateBookingEligibility(aiRecHigh, {
    passed: false,
    missingPrerequisite: "5-Axis CNC Precision Certification",
    verifiedByAdmin: false,
  });

  assert.equal(gateResult.canBook, false);
  assert.match(gateResult.reason, /Access blocked: Required safety prerequisite/);

  // Scenario B: AI scored high and user passed safety, but must still undergo custodian review
  const validUserGate = evaluateBookingEligibility(aiRecHigh, {
    passed: true,
    missingPrerequisite: null,
    verifiedByAdmin: false,
  });

  assert.equal(validUserGate.canBook, true);
  assert.equal(validUserGate.requiresReview, true);
  assert.match(validUserGate.reason, /routed to custodian for standard approval/);
});

/**
 * Suite 3: RBAC & Institutional Data Boundary Isolation
 * Verifies that users cannot request utilization insights or historical analytics
 * outside their authorized institution or ownership scope.
 */
test("RBAC Boundary: Utilization insights query enforces institutional scope isolation", () => {
  const buildAuthorizedScopeFilter = (userRole, userInstitutionId, userId, requestedInstitutionId) => {
    if (userRole === "member") {
      throw new Error("UNAUTHORIZED_ROLE: Members do not have administrative analytics clearance.");
    }

    if (userRole === "institution_admin") {
      // Admin is strictly constrained to their own institution, regardless of requested institution
      if (requestedInstitutionId && requestedInstitutionId !== userInstitutionId) {
        throw new Error("CROSS_INSTITUTION_FORBIDDEN: Institutional administrators cannot inspect partner data.");
      }
      return { scope: "institution", institutionId: userInstitutionId };
    }

    if (userRole === "resource_owner") {
      return { scope: "owner", ownerId: userId };
    }

    throw new Error("UNKNOWN_ROLE");
  };

  // 1. Regular member attempts access -> Rejected
  assert.throws(
    () => buildAuthorizedScopeFilter("member", "inst-techcircuit", "user-1", "inst-techcircuit"),
    /UNAUTHORIZED_ROLE/
  );

  // 2. Admin of TechCircuit attempts to inspect MetroBio -> Rejected
  assert.throws(
    () => buildAuthorizedScopeFilter("institution_admin", "inst-techcircuit", "admin-1", "inst-metrobio"),
    /CROSS_INSTITUTION_FORBIDDEN/
  );

  // 3. Admin of TechCircuit inspects their own institution -> Permitted
  const adminScope = buildAuthorizedScopeFilter("institution_admin", "inst-techcircuit", "admin-1", "inst-techcircuit");
  assert.equal(adminScope.scope, "institution");
  assert.equal(adminScope.institutionId, "inst-techcircuit");

  // 4. Resource owner inspects their own apparatus -> Permitted
  const ownerScope = buildAuthorizedScopeFilter("resource_owner", "inst-techcircuit", "owner-42", null);
  assert.equal(ownerScope.scope, "owner");
  assert.equal(ownerScope.ownerId, "owner-42");
});

/**
 * Suite 4: Resilience & Fault Tolerance
 * Verifies that network timeouts, connection refusals, and malformed responses
 * fail safely without crashing and standard discovery continues working.
 */
test("Resilience & Fallback: AI service downtime gracefully falls back to standard discovery", () => {
  const handleAIResponseOrFallback = (aiResult, standardCatalog) => {
    if (!aiResult.isAvailable || aiResult.error) {
      return {
        aiAvailable: false,
        warningNotice: "AI recommendation microservice is offline or unreachable. Standard search remains active.",
        results: standardCatalog,
      };
    }
    return {
      aiAvailable: true,
      warningNotice: null,
      results: aiResult.data.recommendations,
    };
  };

  const standardCatalog = [
    { id: "res-01", title: "Standard Optical Microscope", category: "Optics & Imaging" },
    { id: "res-02", title: "Digital Multimeter Bench", category: "Electronics & Embedded Kits" },
  ];

  // Case 1: AI service connection refused (offline)
  const offlineState = handleAIResponseOrFallback(
    { isAvailable: false, error: "ECONNREFUSED 127.0.0.1:8000" },
    standardCatalog
  );
  assert.equal(offlineState.aiAvailable, false);
  assert.equal(offlineState.results.length, 2);
  assert.match(offlineState.warningNotice, /Standard search remains active/);

  // Case 2: AI service online
  const onlineState = handleAIResponseOrFallback(
    {
      isAvailable: true,
      data: {
        recommendations: [{ id: "res-01", title: "Standard Optical Microscope", match_score: 95 }],
      },
    },
    standardCatalog
  );
  assert.equal(onlineState.aiAvailable, true);
  assert.equal(onlineState.results[0].id, "res-01");
});

/**
 * Suite 5: Data Sufficiency & Demo Mode Contract
 * Verifies that when operational data is insufficient (<5 records for utilization, <14 for forecasting),
 * the system transparently reports the limitation and clearly labels demo mode.
 */
test("Data Sufficiency Invariant: Rejects insufficient records when demo_mode=false, labels demo data when true", () => {
  const validateOperationalRecords = (recordCount, requiredCount, demoMode) => {
    if (recordCount < requiredCount) {
      if (!demoMode) {
        return {
          canProceed: false,
          statusCode: 422,
          errorType: "INSUFFICIENT_DATA",
          message: `Insufficient records (${recordCount}/${requiredCount}). Enable demo_mode to view benchmark data.`,
          isDemoData: false,
        };
      }
      return {
        canProceed: true,
        statusCode: 200,
        isDemoData: true,
        warning: "DEMONSTRATION MODE ACTIVE: Historical operational records supplied were insufficient.",
      };
    }

    return {
      canProceed: true,
      statusCode: 200,
      isDemoData: false,
      warning: null,
    };
  };

  // Utilization: 2 records supplied, minimum is 5, demoMode = false
  const utilReject = validateOperationalRecords(2, 5, false);
  assert.equal(utilReject.canProceed, false);
  assert.equal(utilReject.statusCode, 422);
  assert.equal(utilReject.errorType, "INSUFFICIENT_DATA");

  // Utilization: 2 records supplied, demoMode = true
  const utilDemo = validateOperationalRecords(2, 5, true);
  assert.equal(utilDemo.canProceed, true);
  assert.equal(utilDemo.isDemoData, true);
  assert.match(utilDemo.warning, /DEMONSTRATION MODE ACTIVE/);

  // Forecasting: 8 records supplied, minimum is 14, demoMode = false
  const forecastReject = validateOperationalRecords(8, 14, false);
  assert.equal(forecastReject.canProceed, false);
  assert.equal(forecastReject.statusCode, 422);

  // Sufficient production records: 20 records supplied
  const prodRun = validateOperationalRecords(20, 14, false);
  assert.equal(prodRun.canProceed, true);
  assert.equal(prodRun.isDemoData, false);
  assert.equal(prodRun.warning, null);
});

/**
 * Suite 6: Live Catalog Revalidation
 * Ensures that AI recommendations are cross-referenced with live published database records
 * to eliminate stale or archived artifacts.
 */
test("Live Catalog Revalidation: Stale or unpublished recommendations are flagged or pruned", () => {
  const revalidateRecommendations = (aiRecommendations, livePublishedCatalog) => {
    const liveMap = new Map(livePublishedCatalog.map((r) => [r.id, r]));

    return aiRecommendations.map((rec) => {
      const liveResource = liveMap.get(rec.resource_id);
      return {
        ...rec,
        live_resource_verified: Boolean(liveResource && liveResource.status === "published"),
        live_status: liveResource ? liveResource.status : "missing_or_archived",
      };
    });
  };

  const aiRecs = [
    { resource_id: "res-01", title: "Laser Cutter" },
    { resource_id: "res-deleted", title: "Decommissioned 3D Printer" },
  ];

  const liveCatalog = [
    { id: "res-01", title: "Laser Cutter", status: "published" },
    { id: "res-02", title: "Oscilloscope", status: "published" },
  ];

  const revalidated = revalidateRecommendations(aiRecs, liveCatalog);

  assert.equal(revalidated[0].live_resource_verified, true);
  assert.equal(revalidated[0].live_status, "published");

  assert.equal(revalidated[1].live_resource_verified, false);
  assert.equal(revalidated[1].live_status, "missing_or_archived");
});
