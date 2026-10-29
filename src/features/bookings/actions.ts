"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { BookingDecision, EligibilityCheckStatus } from "./types";
import { uploadConditionPhoto } from "./services/condition-storage-service";
import {
  sendInAppNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./services/booking-service";

export interface BookingActionResult {
  success?: boolean;
  error?: string;
  bookingId?: string;
}

/**
 * Creates a new booking request for an apparatus or space.
 * Server validates time range, identity, non-past window, duration limit, and publication status.
 */
export async function createBookingRequestAction(
  prevState: unknown,
  formData: FormData
): Promise<BookingActionResult> {
  const { user } = await requireUser("/auth/sign-in");

  const resourceId = formData.get("resource_id")?.toString();
  const startTimeRaw = formData.get("start_time")?.toString();
  const endTimeRaw = formData.get("end_time")?.toString();
  const requestNotes = formData.get("request_notes")?.toString()?.trim() || "";

  if (!resourceId) {
    return { error: "Missing resource identifier." };
  }

  if (!startTimeRaw || !endTimeRaw) {
    return { error: "Please select both a start date/time and end date/time." };
  }

  const startDate = new Date(startTimeRaw);
  const endDate = new Date(endTimeRaw);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { error: "Invalid date or time format provided." };
  }

  // Start must precede end
  if (startDate >= endDate) {
    return { error: "Requested start time must be strictly earlier than end time." };
  }

  // Minimum duration: 15 minutes
  const durationMs = endDate.getTime() - startDate.getTime();
  if (durationMs < 15 * 60 * 1000) {
    return { error: "Reservation must be for at least 15 minutes." };
  }

  // Maximum duration: 30 consecutive days
  if (durationMs > 30 * 24 * 60 * 60 * 1000) {
    return { error: "Reservation cannot exceed 30 consecutive days." };
  }

  // Non-past check: Allow 5 minutes clock-skew leeway
  const nowWithSkew = new Date(Date.now() - 5 * 60 * 1000);
  if (startDate < nowWithSkew) {
    return { error: "Reservation start time cannot be in the past." };
  }

  const supabase = await createClient();

  // Validate resource existence, publication status, and ownership boundary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST select query
  const { data: resource, error: resError } = await (supabase.from("resources") as any)
    .select("id, owner_id, status, title")
    .eq("id", resourceId)
    .single();

  if (resError || !resource) {
    return { error: "Target apparatus not found." };
  }

  if (resource.status !== "published") {
    return { error: "This apparatus is not currently published or accepting bookings." };
  }

  // Prohibit self-booking
  if (resource.owner_id === user.id) {
    return { error: "Resource custodians cannot submit booking reservations for apparatus they manage." };
  }

  // Fair-Use & Governance: Verify borrower account is not suspended
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: borrowerProfile } = await (supabase.from("profiles") as any)
    .select("is_suspended, suspension_reason, full_name, verification_status")
    .eq("id", user.id)
    .single();

  if (borrowerProfile?.is_suspended) {
    return {
      error: `Account Restricted: Your account is on administrative hold (${borrowerProfile.suspension_reason || "Contact facility manager"}). New equipment reservations cannot be submitted.`,
    };
  }

  // Fair-Use: Prevent monopolization of shared resources (maximum 4 active or pending apparatus reservations)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: activeCount } = await (supabase.from("bookings") as any)
    .select("id", { count: "exact", head: true })
    .eq("borrower_id", user.id)
    .in("status", ["requested", "approved", "checked_out"]);

  if (activeCount !== null && activeCount >= 4) {
    return {
      error: `Fair-Use Policy: You currently have ${activeCount} active or pending apparatus reservations. To ensure equitable access for all researchers, please complete or return current equipment before placing additional reservations.`,
    };
  }

  // Insert booking request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST insert query
  const { data: booking, error: insertError } = await (supabase.from("bookings") as any)
    .insert({
      resource_id: resourceId,
      borrower_id: user.id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      status: "requested",
      request_notes: requestNotes || null,
    })
    .select("id")
    .single();

  if (insertError || !booking) {
    console.error("[BookingAction] Insert error:", insertError?.message);
    return { error: `Failed to submit reservation request: ${insertError?.message || "Unknown error"}` };
  }

  // Notify resource custodian of new incoming request
  await sendInAppNotification(
    resource.owner_id,
    "New Reservation Request",
    `${borrowerProfile?.full_name || "A researcher"} requested "${resource.title}" (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}).`,
    "booking",
    booking.id,
    resourceId,
    undefined,
    "/approvals?status=pending",
    `booking_requested_${booking.id}`
  );

  revalidatePath(`/resources/${resourceId}`);
  revalidatePath("/bookings");
  revalidatePath("/approvals");
  revalidatePath("/");

  redirect("/bookings");
}

/**
 * Custodian decision action: Approve, Reject, or Waitlist a booking request.
 */
export async function decideBookingAction(
  bookingId: string,
  decision: BookingDecision,
  decisionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  // Fetch booking and verify caller is custodian
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST join query
  const { data: booking, error: fetchError } = await (supabase.from("bookings") as any)
    .select(
      `
      id,
      resource_id,
      borrower_id,
      status,
      start_time,
      end_time,
      resource:resources (
        owner_id,
        title,
        institution_id
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking record not found." };
  }

  // Check caller role & permissions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: callerProfile } = await (supabase.from("profiles") as any)
    .select("role, institution_id")
    .eq("id", user.id)
    .single();

  const isOwner = booking.resource?.owner_id === user.id;
  const isPlatformAdmin = callerProfile?.role === "admin";
  const isInstitutionAdmin =
    callerProfile?.role === "institution_admin" &&
    Boolean(callerProfile?.institution_id) &&
    callerProfile.institution_id === booking.resource?.institution_id;

  if (!isOwner && !isPlatformAdmin && !isInstitutionAdmin) {
    return {
      success: false,
      error: "Unauthorized: Only the apparatus custodian or institutional administrator can authorize reservations.",
    };
  }

  if (booking.borrower_id === user.id && !isPlatformAdmin && !isInstitutionAdmin) {
    return { success: false, error: "You cannot approve your own booking." };
  }

  if (booking.status !== "requested" && booking.status !== "waitlisted") {
    return {
      success: false,
      error: `This booking is in "${booking.status}" status and can no longer be decided.`,
    };
  }

  // If rejecting, require explanation
  if (decision === "rejected" && (!decisionNotes || decisionNotes.trim().length === 0)) {
    return { success: false, error: "Please provide a reason when rejecting a booking request." };
  }

  // If approving, check eligibility prerequisites
  if (decision === "approved") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST count query
    const { count: pendingChecks } = await (supabase.from("eligibility_checks") as any)
      .select("id", { count: "exact", head: true })
      .eq("booking_id", bookingId)
      .in("status", ["pending", "failed"]);

    if (pendingChecks && pendingChecks > 0) {
      return {
        success: false,
        error: `Cannot approve: There are ${pendingChecks} mandatory eligibility requirement(s) pending verification or failed. Please review and verify prerequisites first.`,
      };
    }
  }

  // Update status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST update query
  const { error: updateError } = await (supabase.from("bookings") as any)
    .update({
      status: decision,
      decision_by: user.id,
      decision_at: new Date().toISOString(),
      decision_notes: decisionNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    // PostgreSQL exclusion constraint violation (code 23P01)
    if (updateError.code === "23P01" || updateError.message.includes("prevent_overlapping_active_bookings")) {
      return {
        success: false,
        error: "Scheduling conflict: This apparatus already has an active approved reservation during this time window. You can place this request on the waiting list instead.",
      };
    }

    return { success: false, error: updateError.message };
  }

  // Send notification to borrower regarding custodian decision
  const decisionTitle =
    decision === "approved"
      ? "Reservation Request Approved"
      : decision === "waitlisted"
      ? "Placed on Waiting List"
      : "Reservation Request Declined";
  const decisionMsg =
    decision === "approved"
      ? `Your reservation for "${booking.resource?.title || "apparatus"}" has been authorized. You can proceed with safety acknowledgement at handover time.`
      : decision === "waitlisted"
      ? `Your request for "${booking.resource?.title || "apparatus"}" is on the waiting list. You will be notified if a slot opens.`
      : `Your reservation request for "${booking.resource?.title || "apparatus"}" was declined: ${decisionNotes || "No specific reason provided."}`;

  await sendInAppNotification(
    booking.borrower_id,
    decisionTitle,
    decisionMsg,
    "booking",
    bookingId,
    booking.resource_id,
    undefined,
    `/bookings/${bookingId}`,
    `decision_${decision}_${bookingId}`
  );

  revalidatePath("/approvals");
  revalidatePath("/bookings");
  revalidatePath(`/resources/${booking.resource_id}`);

  return { success: true };
}

/**
 * Cancels a booking request. Can be invoked by borrower or custodian.
 */
export async function cancelBookingAction(
  bookingId: string,
  cancelReason?: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST select query
  const { data: booking, error: fetchError } = await (supabase.from("bookings") as any)
    .select(
      `
      id,
      resource_id,
      borrower_id,
      status,
      resource:resources (title, owner_id)
    `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking not found." };
  }

  const isBorrower = booking.borrower_id === user.id;
  const isOwner = booking.resource?.owner_id === user.id;

  if (!isBorrower && !isOwner) {
    return { success: false, error: "Unauthorized to cancel this booking." };
  }

  if (["completed", "returned", "rejected", "cancelled"].includes(booking.status)) {
    return { success: false, error: `Cannot cancel booking in status "${booking.status}".` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST update query
  const { error: updateError } = await (supabase.from("bookings") as any)
    .update({
      status: "cancelled",
      decision_notes: cancelReason || (isBorrower ? "Cancelled by borrower" : "Cancelled by custodian"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Notify counterparty of cancellation
  const counterpartyId = isBorrower ? booking.resource?.owner_id : booking.borrower_id;
  if (counterpartyId) {
    await sendInAppNotification(
      counterpartyId,
      "Reservation Cancelled",
      `Reservation for "${booking.resource?.title || "apparatus"}" was cancelled (${isBorrower ? "by borrower" : "by custodian"}).`,
      "booking",
      bookingId,
      booking.resource_id,
      undefined,
      `/bookings/${bookingId}`,
      `cancelled_${bookingId}`
    );
  }

  // Transparent Waitlist Notification: If slot opened, notify the first waitlisted candidate (FIFO)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: topWaitlisted } = await (supabase.from("bookings") as any)
    .select("id, borrower_id, resource:resources (title)")
    .eq("resource_id", booking.resource_id)
    .eq("status", "waitlisted")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (topWaitlisted?.borrower_id) {
    await sendInAppNotification(
      topWaitlisted.borrower_id,
      "Waitlist Priority Notice",
      `A timeslot has opened for "${topWaitlisted.resource?.title || "apparatus"}". You are #1 on the waiting list!`,
      "booking",
      topWaitlisted.id,
      booking.resource_id,
      undefined,
      `/bookings/${topWaitlisted.id}`,
      `waitlist_promoted_${topWaitlisted.id}`
    );
  }

  revalidatePath("/bookings");
  revalidatePath("/approvals");
  revalidatePath(`/resources/${booking.resource_id}`);

  return { success: true };
}

/**
 * Custodian reviews and updates a specific eligibility check for a booking.
 */
export async function resolveEligibilityCheckAction(
  checkId: string,
  status: EligibilityCheckStatus,
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST update query
  const { error } = await (supabase.from("eligibility_checks") as any)
    .update({
      status,
      reviewer_id: user.id,
      review_notes: reviewNotes || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/approvals");
  revalidatePath("/bookings");

  return { success: true };
}

// Resilient helper to handle environments where extended migration columns may not yet be present
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeInsertConditionReport(supabase: any, reportData: Record<string, any>) {
  const { error } = await (supabase.from("condition_reports") as any).insert(reportData);
  if (!error) return { error: null };

  if (
    error.message?.includes("column") ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message?.includes("schema cache")
  ) {
    const basePayload = {
      booking_id: reportData.booking_id,
      stage: reportData.stage,
      reporter_id: reportData.reporter_id,
      notes: reportData.notes,
      photos: reportData.photos || [],
    };
    const { error: baseError } = await (supabase.from("condition_reports") as any).insert(basePayload);
    return { error: baseError };
  }

  return { error };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeUpdateConditionReport(
  supabase: any,
  bookingId: string,
  stage: string,
  updateData: Record<string, any>
) {
  const { error } = await (supabase.from("condition_reports") as any)
    .update(updateData)
    .eq("booking_id", bookingId)
    .eq("stage", stage);

  if (!error) return { error: null };

  if (
    error.message?.includes("column") ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message?.includes("schema cache")
  ) {
    return { error: null };
  }

  return { error };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeInsertIncident(supabase: any, incidentData: Record<string, any>) {
  const { error } = await (supabase.from("incidents") as any).insert(incidentData);
  if (!error) return { error: null };

  if (
    error.message?.includes("column") ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message?.includes("schema cache")
  ) {
    const basePayload = {
      booking_id: incidentData.booking_id,
      reporter_id: incidentData.reporter_id,
      incident_type: incidentData.incident_type,
      description: incidentData.description,
      status: incidentData.status || "open",
    };
    const { error: baseError } = await (supabase.from("incidents") as any).insert(basePayload);
    return { error: baseError };
  }

  return { error };
}

/**
 * Executes equipment handover/checkout for an approved reservation.
 * Verifies caller authorization (borrower or custodian), ensures booking is approved,
 * requires safety instruction acknowledgement, stores baseline condition report & photos,
 * and advances booking status to 'checked_out'.
 */
export async function checkoutBookingAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const bookingId = formData.get("booking_id")?.toString();
  const conditionNotes = formData.get("condition_notes")?.toString()?.trim() || "Resource handed over in verified operational condition.";
  const safetyAck = formData.get("safety_acknowledged");
  const isSafetyAcknowledged = safetyAck === "true" || safetyAck === "on" || safetyAck === "1";

  if (!bookingId) {
    return { success: false, error: "Missing booking identifier." };
  }

  if (!isSafetyAcknowledged) {
    return { success: false, error: "You must review and acknowledge the apparatus safety instructions before checkout." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST select query
  const { data: booking, error: fetchError } = await (supabase.from("bookings") as any)
    .select(
      `
      id,
      resource_id,
      borrower_id,
      status,
      start_time,
      end_time,
      resource:resources (
        owner_id,
        title
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking record not found." };
  }

  const isBorrower = booking.borrower_id === user.id;
  const isOwner = booking.resource?.owner_id === user.id;

  if (!isBorrower && !isOwner) {
    return { success: false, error: "Unauthorized: You are not a recognized participant in this reservation." };
  }

  if (booking.status !== "approved") {
    return {
      success: false,
      error: `Apparatus cannot be checked out. Current reservation status is "${booking.status}". Only approved reservations can be checked out.`,
    };
  }

  // Upload any attached condition photos
  const photoUrls: string[] = [];
  const photoFiles = formData.getAll("photos") as File[];
  for (const file of photoFiles) {
    if (file && typeof file === "object" && file.size > 0) {
      const uploadRes = await uploadConditionPhoto(file, bookingId, "checkout");
      if (uploadRes.url) {
        photoUrls.push(uploadRes.url);
      } else if (uploadRes.error) {
        console.warn("[Checkout] Photo upload warning:", uploadRes.error);
      }
    }
  }

  // Record baseline condition report
  const { error: conditionError } = await safeInsertConditionReport(supabase, {
    booking_id: bookingId,
    resource_id: booking.resource_id,
    stage: "checkout",
    reporter_id: user.id,
    notes: conditionNotes,
    photos: photoUrls,
    safety_acknowledged: true,
    issues_flagged: false,
    review_status: "approved",
    reported_at: new Date().toISOString(),
  });

  if (conditionError) {
    console.error("[Checkout] Condition report error:", conditionError.message);
    return { success: false, error: `Failed to record checkout condition: ${conditionError.message}` };
  }

  // Advance booking status to 'checked_out'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST update query
  const { error: updateError } = await (supabase.from("bookings") as any)
    .update({
      status: "checked_out",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Send notification to the counterparty
  const targetRecipient = isBorrower ? booking.resource?.owner_id : booking.borrower_id;
  if (targetRecipient) {
    await sendInAppNotification(
      targetRecipient,
      "Apparatus Checked Out",
      `Active loan initiated for "${booking.resource?.title}". Safety instructions verified.`,
      "checkout",
      bookingId
    );
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/approvals");

  return { success: true };
}

/**
 * Submits return confirmation by the borrower or custodian.
 * Computes return lateness against scheduled booking end_time, stores condition observations,
 * flags any issues (damage, malfunctions, missing items), and advances status to 'returned'.
 */
export async function returnBookingAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const bookingId = formData.get("booking_id")?.toString();
  const conditionNotes = formData.get("condition_notes")?.toString()?.trim() || "Resource returned following usage.";
  const issuesFlaggedRaw = formData.get("issues_flagged");
  const hasIssues = issuesFlaggedRaw === "true" || issuesFlaggedRaw === "on" || issuesFlaggedRaw === "1";
  
  const rawIssueTypes = formData.getAll("issue_types");
  const issueTypes = rawIssueTypes.map((i) => i.toString());

  if (!bookingId) {
    return { success: false, error: "Missing booking identifier." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST select query
  const { data: booking, error: fetchError } = await (supabase.from("bookings") as any)
    .select(
      `
      id,
      resource_id,
      borrower_id,
      status,
      start_time,
      end_time,
      resource:resources (
        owner_id,
        title
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking record not found." };
  }

  const isBorrower = booking.borrower_id === user.id;
  const isOwner = booking.resource?.owner_id === user.id;

  if (!isBorrower && !isOwner) {
    return { success: false, error: "Unauthorized: You are not a recognized participant in this reservation." };
  }

  if (booking.status !== "checked_out") {
    return {
      success: false,
      error: `Return cannot be processed. Current status is "${booking.status}". Only checked-out apparatus can be returned.`,
    };
  }

  // Compute accurate lateness against reservation end_time
  const now = new Date();
  const scheduledEnd = new Date(booking.end_time);
  const isLate = now.getTime() > scheduledEnd.getTime();
  const lateMinutes = isLate ? Math.max(0, Math.floor((now.getTime() - scheduledEnd.getTime()) / 60000)) : 0;

  // Upload any attached return condition photos
  const photoUrls: string[] = [];
  const photoFiles = formData.getAll("photos") as File[];
  for (const file of photoFiles) {
    if (file && typeof file === "object" && file.size > 0) {
      const uploadRes = await uploadConditionPhoto(file, bookingId, "return");
      if (uploadRes.url) {
        photoUrls.push(uploadRes.url);
      } else if (uploadRes.error) {
        console.warn("[Return] Photo upload warning:", uploadRes.error);
      }
    }
  }

  // Record return condition report
  const { error: conditionError } = await safeInsertConditionReport(supabase, {
    booking_id: bookingId,
    resource_id: booking.resource_id,
    stage: "return",
    reporter_id: user.id,
    notes: conditionNotes,
    photos: photoUrls,
    issues_flagged: hasIssues,
    issue_types: issueTypes,
    is_late: isLate,
    late_minutes: lateMinutes,
    review_status: "pending",
    reported_at: now.toISOString(),
  });

  if (conditionError) {
    console.error("[Return] Condition report error:", conditionError.message);
    return { success: false, error: `Failed to record return condition: ${conditionError.message}` };
  }

  // Advance booking status to 'returned' (ready for custodian inspection)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST update query
  const { error: updateError } = await (supabase.from("bookings") as any)
    .update({
      status: "returned",
      updated_at: now.toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Send notification to custodian that apparatus has been returned and awaits inspection
  if (booking.resource?.owner_id) {
    const lateNotice = isLate ? ` (Returned ${lateMinutes} minutes late)` : "";
    const issueNotice = hasIssues ? " — ISSUES REPORTED" : "";
    await sendInAppNotification(
      booking.resource.owner_id,
      "Apparatus Returned — Inspection Pending",
      `"${booking.resource?.title}" has been returned${lateNotice}${issueNotice}. Please inspect condition to close the loan.`,
      "return",
      bookingId
    );
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/approvals");

  return { success: true };
}

/**
 * Custodian Return Inspection Action.
 * Inspects submitted return condition against checkout baseline.
 * If clean, closes booking as 'completed'.
 * If damaged or disputed, flags condition report and opens an incident record.
 * Prohibits borrower from reviewing or approving their own return.
 */
export async function inspectReturnAction(
  bookingId: string,
  decision: "completed" | "flag_incident",
  inspectionNotes?: string,
  incidentData?: { incidentType: string; description: string }
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  // Fetch booking and verify caller is custodian
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST select query
  const { data: booking, error: fetchError } = await (supabase.from("bookings") as any)
    .select(
      `
      id,
      resource_id,
      borrower_id,
      status,
      resource:resources (
        owner_id,
        title
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking record not found." };
  }

  const isOwner = booking.resource?.owner_id === user.id;
  if (!isOwner) {
    return { success: false, error: "Unauthorized: Only the resource custodian can inspect and verify returns." };
  }

  // Prohibit self-inspection
  if (booking.borrower_id === user.id) {
    return { success: false, error: "Borrowers cannot review or approve their own return inspection." };
  }

  if (booking.status !== "returned") {
    return {
      success: false,
      error: `Return inspection cannot be performed. Current status is "${booking.status}". Apparatus must be in "returned" status.`,
    };
  }

  const nowIso = new Date().toISOString();

  if (decision === "completed") {
    // Check if there are any unresolved incidents on this booking before completing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST count query
    const { count: openIncidents } = await (supabase.from("incidents") as any)
      .select("id", { count: "exact", head: true })
      .eq("booking_id", bookingId)
      .in("status", ["open", "under_review", "awaiting_information"]);

    if (openIncidents && openIncidents > 0) {
      return {
        success: false,
        error: `Cannot complete booking: There are ${openIncidents} unresolved incident report(s) requiring closure first.`,
      };
    }

    // Update return condition report review status
    await safeUpdateConditionReport(supabase, bookingId, "return", {
      review_status: "approved",
      reviewer_id: user.id,
      review_notes: inspectionNotes || "Return verified in acceptable condition.",
      reviewed_at: nowIso,
    });

    // Close booking as completed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST update query
    const { error: updateError } = await (supabase.from("bookings") as any)
      .update({
        status: "completed",
        decision_by: user.id,
        decision_notes: inspectionNotes || "Return inspection approved. Transaction closed.",
        updated_at: nowIso,
      })
      .eq("id", bookingId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Send notification to borrower
    await sendInAppNotification(
      booking.borrower_id,
      "Loan Completed & Verified",
      `Custodian approved the return inspection for "${booking.resource?.title}". Your reservation is successfully closed.`,
      "completed",
      bookingId
    );
  } else if (decision === "flag_incident") {
    // Flag the condition report
    await safeUpdateConditionReport(supabase, bookingId, "return", {
      review_status: "flagged",
      reviewer_id: user.id,
      review_notes: inspectionNotes || "Inspection flagged with condition concerns.",
      reviewed_at: nowIso,
    });

    // Create incident record
    const incidentType = incidentData?.incidentType || "damage";
    const incidentDesc = incidentData?.description || inspectionNotes || "Return condition failed visual or operational inspection.";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST insert query
    const { error: incError } = await (supabase.from("incidents") as any).insert({
      booking_id: bookingId,
      resource_id: booking.resource_id,
      reporter_id: user.id,
      incident_type: incidentType,
      description: incidentDesc,
      status: "open",
    });

    if (incError) {
      return { success: false, error: `Failed to file return incident: ${incError.message}` };
    }

    // Send notification to borrower
    await sendInAppNotification(
      booking.borrower_id,
      "Return Flagged — Incident Opened",
      `The custodian flagged issues during inspection of "${booking.resource?.title}": ${incidentDesc}`,
      "incident",
      bookingId
    );
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/approvals");

  return { success: true };
}

/**
 * Files an incident report for damage, malfunction, missing accessories, or disputes.
 */
export async function reportIncidentAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const bookingId = formData.get("booking_id")?.toString();
  const incidentType = formData.get("incident_type")?.toString() || "damage";
  const description = formData.get("description")?.toString()?.trim();

  if (!bookingId || !description) {
    return { success: false, error: "Please provide a valid booking and detailed description of the incident." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST select query
  const { data: booking, error: fetchError } = await (supabase.from("bookings") as any)
    .select(
      `
      id,
      resource_id,
      borrower_id,
      resource:resources (
        owner_id,
        title
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking record not found." };
  }

  const isBorrower = booking.borrower_id === user.id;
  const isOwner = booking.resource?.owner_id === user.id;

  if (!isBorrower && !isOwner) {
    return { success: false, error: "Unauthorized: Only recognized participants can report incidents for this booking." };
  }

  // Upload any attached incident evidence photos
  const photoUrls: string[] = [];
  const photoFiles = formData.getAll("photos") as File[];
  for (const file of photoFiles) {
    if (file && typeof file === "object" && file.size > 0) {
      const uploadRes = await uploadConditionPhoto(file, bookingId, "incident");
      if (uploadRes.url) {
        photoUrls.push(uploadRes.url);
      }
    }
  }

  // Insert incident
  const { error: insertError } = await safeInsertIncident(supabase, {
    booking_id: bookingId,
    resource_id: booking.resource_id,
    reporter_id: user.id,
    incident_type: incidentType,
    description,
    photos: photoUrls,
    status: "open",
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Notify counterparty
  const recipientId = isBorrower ? booking.resource?.owner_id : booking.borrower_id;
  if (recipientId) {
    await sendInAppNotification(
      recipientId,
      "New Incident Report Filed",
      `An incident (${incidentType}) has been reported for "${booking.resource?.title}": ${description.slice(0, 80)}...`,
      "incident",
      bookingId
    );
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/approvals");

  return { success: true };
}

/**
 * Resolves or updates an incident report. Only custodians or administrators are permitted.
 */
export async function resolveIncidentAction(
  incidentId: string,
  newStatus: "under_review" | "awaiting_information" | "resolved" | "dismissed",
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST select query
  const { data: incident, error: fetchError } = await (supabase.from("incidents") as any)
    .select(
      `
      id,
      booking_id,
      reporter_id,
      resource:resources (
        owner_id,
        title
      )
    `
    )
    .eq("id", incidentId)
    .single();

  if (fetchError || !incident) {
    return { success: false, error: "Incident record not found." };
  }

  const isOwner = incident.resource?.owner_id === user.id;
  if (!isOwner) {
    return { success: false, error: "Unauthorized: Only the resource custodian can resolve incidents." };
  }

  const isFinal = newStatus === "resolved" || newStatus === "dismissed";
  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST update query
  const { error: updateError } = await (supabase.from("incidents") as any)
    .update({
      status: newStatus,
      resolution_notes: resolutionNotes?.trim() || null,
      resolved_by: isFinal ? user.id : null,
      resolved_at: isFinal ? nowIso : null,
      updated_at: nowIso,
    })
    .eq("id", incidentId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Notify reporter
  if (incident.reporter_id) {
    await sendInAppNotification(
      incident.reporter_id,
      `Incident Status: ${newStatus.replace("_", " ").toUpperCase()}`,
      `The incident report for "${incident.resource?.title}" has been updated to "${newStatus}". Notes: ${resolutionNotes || "None"}`,
      "incident",
      incident.booking_id
    );
  }

  if (incident.booking_id) {
    revalidatePath(`/bookings/${incident.booking_id}`);
  }
  revalidatePath("/bookings");
  revalidatePath("/approvals");

  return { success: true };
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const res = await markNotificationAsRead(notificationId, user.id);
  if (res.success) {
    revalidatePath("/notifications");
    revalidatePath("/");
  }
  return res;
}

/**
 * Marks all notifications for the current user as read.
 */
export async function markAllNotificationsAsReadAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const { user } = await requireUser();
  const res = await markAllNotificationsAsRead(user.id);
  if (res.success) {
    revalidatePath("/notifications");
    revalidatePath("/");
  }
  return res;
}


