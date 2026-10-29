"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { sendInAppNotification } from "@/features/bookings/services/booking-service";

export type ProfileActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

/**
 * Updates researcher display name and department.
 */
export async function updateProfileAction(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const fullName = formData.get("fullName")?.toString().trim();
  if (!fullName || fullName.length < 2) {
    return { error: "Please enter a valid full name (minimum 2 characters)." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any)
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { success: true, message: "Profile details updated successfully." };
}

/**
 * Submits an institutional verification request.
 * Sets verification_status to 'pending' with optional credential notes.
 */
export async function requestVerificationAction(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const notes = formData.get("notes")?.toString().trim();

  // Fetch user profile and institution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (supabase.from("profiles") as any)
    .select("verification_status, institution_id, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found." };
  }

  if (profile.verification_status === "verified") {
    return { error: "Your institutional account is already verified." };
  }

  if (profile.verification_status === "pending") {
    return { error: "A verification request is already pending review by your facility administrator." };
  }

  // Try RPC first if available, otherwise direct update
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rpcError } = await (supabase.rpc as any)("request_institutional_verification", {
    notes: notes || null,
  });

  if (rpcError) {
    // Fallback to direct update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { error: updateError } = await (supabase.from("profiles") as any)
      .update({
        verification_status: "pending",
        verification_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError && updateError.message.includes("verification_notes")) {
      console.warn("[ProfileAction] Fallback: profiles lacks verification_notes column, retrying");
      const retry = await (supabase.from("profiles") as any)
        .update({
          verification_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      updateError = retry.error;
    }

    if (updateError) {
      return { error: `Failed to submit verification request: ${updateError.message}` };
    }
  }

  // Notify institutional administrators if institution is assigned
  if (profile.institution_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: admins } = await (supabase.from("profiles") as any)
      .select("id")
      .eq("institution_id", profile.institution_id)
      .eq("role", "institution_admin");

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await sendInAppNotification(
          admin.id,
          "New Verification Request",
          `${profile.full_name || "A member"} has requested institutional verification clearance.`,
          "governance",
          undefined,
          undefined,
          undefined,
          "/admin",
          `verif_request_${user.id}_${Date.now()}`
        );
      }
    }
  }

  revalidatePath("/profile");
  revalidatePath("/admin");
  return {
    success: true,
    message: "Institutional verification request submitted. Your facility manager will review your credentials.",
  };
}
