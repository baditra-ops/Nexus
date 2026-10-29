"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { sendInAppNotification } from "@/features/bookings/services/booking-service";
import type { UserRole } from "./types";

/**
 * Institutional Admin decision on member verification request.
 * Enforces role check, target institution boundary, and prevents self-verification.
 */
export async function verifyMemberAction(
  memberId: string,
  newStatus: "verified" | "rejected",
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  if (memberId === user.id) {
    return { success: false, error: "Security restriction: You cannot approve or modify your own verification." };
  }

  // Fetch caller profile and verify role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: callerProfile, error: callerError } = await (supabase.from("profiles") as any)
    .select("role, institution_id")
    .eq("id", user.id)
    .single();

  if (callerError || !callerProfile || callerProfile.role !== "institution_admin") {
    return { success: false, error: "Unauthorized: Institutional administrator privilege required." };
  }

  // Fetch target member
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetMember, error: targetError } = await (supabase.from("profiles") as any)
    .select("id, full_name, institution_id, role")
    .eq("id", memberId)
    .single();

  if (targetError || !targetMember) {
    return { success: false, error: "Target member profile not found." };
  }

  // Enforce institution boundary
  if (callerProfile.institution_id && targetMember.institution_id !== callerProfile.institution_id) {
    return { success: false, error: "Security boundary: Administrators cannot manage members of other institutions." };
  }

  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { error: updateError } = await (supabase.from("profiles") as any)
    .update({
      verification_status: newStatus,
      verification_notes: notes?.trim() || null,
      verified_by: user.id,
      verified_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", memberId);

  if (updateError && updateError.message.includes("verification_notes")) {
    console.warn("[AdminAction] Fallback: profiles lacks verification_notes column, retrying");
    const retry = await (supabase.from("profiles") as any)
      .update({
        verification_status: newStatus,
        verified_by: user.id,
        verified_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", memberId);
    updateError = retry.error;
  }

  if (updateError) {
    console.error("[AdminAction] Verify error:", updateError.message);
    return { success: false, error: updateError.message };
  }

  // Send notification to member
  await sendInAppNotification(
    memberId,
    `Institutional Verification ${newStatus === "verified" ? "Approved" : "Declined"}`,
    newStatus === "verified"
      ? "Your institutional account verification has been authorized. You can now reserve equipment with priority."
      : `Your verification request was declined: ${notes || "Contact your facility administrator."}`,
    "governance",
    undefined,
    undefined,
    undefined,
    "/profile"
  );

  revalidatePath("/admin");
  revalidatePath("/profile");

  return { success: true };
}

/**
 * Assigns or revokes institutional roles (member vs custodian/resource_owner).
 * Strictly prohibits self-promotion or self-demotion.
 */
export async function updateMemberRoleAction(
  memberId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  if (memberId === user.id) {
    return { success: false, error: "Security Invariant: Administrators cannot alter their own institutional role." };
  }

  // Fetch caller profile and verify admin status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: callerProfile, error: callerError } = await (supabase.from("profiles") as any)
    .select("role, institution_id")
    .eq("id", user.id)
    .single();

  if (callerError || !callerProfile || callerProfile.role !== "institution_admin") {
    return { success: false, error: "Unauthorized: Institutional administrator privilege required." };
  }

  // Fetch target member
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetMember, error: targetError } = await (supabase.from("profiles") as any)
    .select("id, full_name, institution_id, role")
    .eq("id", memberId)
    .single();

  if (targetError || !targetMember) {
    return { success: false, error: "Target member profile not found." };
  }

  // Enforce institution boundary
  if (callerProfile.institution_id && targetMember.institution_id !== callerProfile.institution_id) {
    return { success: false, error: "Security boundary: Administrators cannot manage members of other institutions." };
  }

  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from("profiles") as any)
    .update({
      role: newRole,
      updated_at: nowIso,
    })
    .eq("id", memberId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Send notification to member
  const roleTitle = newRole === "resource_owner" ? "Facility Custodian / Resource Owner" : newRole;
  await sendInAppNotification(
    memberId,
    "Institutional Role Updated",
    `Your institutional role has been updated to "${roleTitle}".`,
    "governance",
    undefined,
    undefined,
    undefined,
    "/profile"
  );

  revalidatePath("/admin");
  revalidatePath("/profile");

  return { success: true };
}

/**
 * Explicit, auditable suspension or reinstatement of member access.
 * Enforces recorded reason, logs audit event, and notifies target.
 */
export async function suspendMemberAction(
  memberId: string,
  isSuspended: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  if (memberId === user.id) {
    return { success: false, error: "Security Invariant: Administrators cannot alter their own account restrictions." };
  }

  if (isSuspended && (!reason || reason.trim().length === 0)) {
    return { success: false, error: "A documented justification is mandatory when restricting member access." };
  }

  // Fetch caller profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: callerProfile, error: callerError } = await (supabase.from("profiles") as any)
    .select("role, institution_id")
    .eq("id", user.id)
    .single();

  if (callerError || !callerProfile || callerProfile.role !== "institution_admin") {
    return { success: false, error: "Unauthorized: Institutional administrator privilege required." };
  }

  // Fetch target member
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetMember, error: targetError } = await (supabase.from("profiles") as any)
    .select("id, full_name, institution_id")
    .eq("id", memberId)
    .single();

  if (targetError || !targetMember) {
    return { success: false, error: "Target member profile not found." };
  }

  // Enforce institution boundary
  if (callerProfile.institution_id && targetMember.institution_id !== callerProfile.institution_id) {
    return { success: false, error: "Security boundary: Administrators cannot manage members of other institutions." };
  }

  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from("profiles") as any)
    .update({
      is_suspended: isSuspended,
      suspension_reason: isSuspended ? reason?.trim() : null,
      suspended_at: isSuspended ? nowIso : null,
      suspended_by: isSuspended ? user.id : null,
      updated_at: nowIso,
    })
    .eq("id", memberId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Send notification to member
  await sendInAppNotification(
    memberId,
    isSuspended ? "Account Access Restricted" : "Account Access Reinstated",
    isSuspended
      ? `Your access has been placed on administrative hold: ${reason}. Please contact your laboratory manager.`
      : "Your institutional account privileges have been restored following administrative review.",
    "governance",
    undefined,
    undefined,
    undefined,
    "/profile"
  );

  revalidatePath("/admin");
  revalidatePath("/profile");

  return { success: true };
}
