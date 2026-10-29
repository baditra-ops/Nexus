"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { uploadResourceImage } from "./services/storage-service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResourceStatus, ResourceType } from "@/types/database.types";

export type ResourceActionResult = {
  error?: string;
  success?: boolean;
  resourceId?: string;
};

/**
 * Creates a new resource listing (either as draft or published).
 */
export async function createResourceAction(
  _prevState: ResourceActionResult | null,
  formData: FormData
): Promise<ResourceActionResult> {
  const { user } = await requireUser();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const category = formData.get("category")?.toString().trim();
  const resourceType = (formData.get("resource_type")?.toString() || "equipment") as ResourceType;
  const location = formData.get("location")?.toString().trim() || null;
  const institutionId = formData.get("institution_id")?.toString().trim() || null;
  const eligibilityRequirements = formData.get("eligibility_requirements")?.toString().trim() || null;
  const usageRules = formData.get("usage_rules")?.toString().trim() || null;
  const depositStr = formData.get("deposit_amount")?.toString() || "0";
  const currency = formData.get("currency")?.toString().toUpperCase() || "USD";
  const status = (formData.get("status")?.toString() || "draft") as ResourceStatus;

  // Validation
  if (!title || title.length < 3) {
    return { error: "Resource title must be at least 3 characters long." };
  }

  if (!category) {
    return { error: "Please select a valid resource category." };
  }

  const depositAmount = parseFloat(depositStr);
  if (isNaN(depositAmount) || depositAmount < 0) {
    return { error: "Deposit amount must be a non-negative number." };
  }

  // Handle optional image upload
  const images: string[] = [];
  const imageFile = formData.get("image_file") as File | null;
  if (imageFile && imageFile.size > 0) {
    const uploadRes = await uploadResourceImage(imageFile, user.id);
    if (uploadRes.url) {
      images.push(uploadRes.url);
    } else if (uploadRes.error) {
      // If upload failed, note the warning but allow draft creation if needed
      console.warn("[ResourceAction] Image upload warning:", uploadRes.error);
    }
  }

  // Existing image URL fallback
  const imageUrlFallback = formData.get("image_url")?.toString().trim();
  if (imageUrlFallback && !images.includes(imageUrlFallback)) {
    images.push(imageUrlFallback);
  }

  const supabase = await createClient();

  const baseResourceData = {
    owner_id: user.id,
    institution_id: institutionId || null,
    title,
    description,
    category,
    location,
    images: images,
    eligibility_requirements: eligibilityRequirements,
    usage_rules: usageRules,
    deposit_amount: depositAmount,
    currency,
    status,
  };

  let { data: insertedResource, error: insertError } = await (
    supabase.from("resources") as any // eslint-disable-line @typescript-eslint/no-explicit-any
  )
    .insert({
      ...baseResourceData,
      resource_type: resourceType,
    })
    .select("id")
    .single();

  // Schema resilience: Fallback if remote table lacks resource_type column
  if (insertError && insertError.message.includes("resource_type")) {
    console.warn("[ResourceAction] Fallback: resources table lacks resource_type column, retrying without it");
    const retry = await (supabase.from("resources") as any)
      .insert(baseResourceData)
      .select("id")
      .single();
    insertedResource = retry.data;
    insertError = retry.error;
  }

  if (insertError || !insertedResource) {
    console.error("[ResourceAction] Insert error:", insertError?.message);
    return { error: `Failed to create resource: ${insertError?.message || "Unknown error"}` };
  }

  // Handle structured availability windows
  const availabilityJson = formData.get("availability_json")?.toString();
  if (availabilityJson) {
    try {
      const windows = JSON.parse(availabilityJson) as {
        day_of_week: number;
        start_time: string;
        end_time: string;
      }[];

      if (Array.isArray(windows) && windows.length > 0) {
        const rows = windows.map((w) => ({
          resource_id: insertedResource.id,
          day_of_week: w.day_of_week,
          start_time: w.start_time,
          end_time: w.end_time,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST schema inference workaround
        await (supabase.from("resource_availability") as any).insert(rows);
      }
    } catch (e) {
      console.warn("[ResourceAction] Availability parse notice:", e);
    }
  }

  revalidatePath("/my-resources");
  revalidatePath("/resources");
  revalidatePath("/");

  redirect("/my-resources");
}

/**
 * Updates an existing resource listing.
 */
export async function updateResourceAction(
  resourceId: string,
  _prevState: ResourceActionResult | null,
  formData: FormData
): Promise<ResourceActionResult> {
  const { user } = await requireUser();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const category = formData.get("category")?.toString().trim();
  const resourceType = (formData.get("resource_type")?.toString() || "equipment") as ResourceType;
  const location = formData.get("location")?.toString().trim() || null;
  const institutionId = formData.get("institution_id")?.toString().trim() || null;
  const eligibilityRequirements = formData.get("eligibility_requirements")?.toString().trim() || null;
  const usageRules = formData.get("usage_rules")?.toString().trim() || null;
  const depositStr = formData.get("deposit_amount")?.toString() || "0";
  const currency = formData.get("currency")?.toString().toUpperCase() || "USD";
  const status = (formData.get("status")?.toString() || "draft") as ResourceStatus;

  if (!title || title.length < 3) {
    return { error: "Resource title must be at least 3 characters long." };
  }

  const depositAmount = parseFloat(depositStr);
  if (isNaN(depositAmount) || depositAmount < 0) {
    return { error: "Deposit amount must be a non-negative number." };
  }

  const supabase = await createClient();

  // Verify ownership before modifying
  const { data: existing, error: checkError } = await (
    supabase.from("resources") as any // eslint-disable-line @typescript-eslint/no-explicit-any
  )
    .select("owner_id, images")
    .eq("id", resourceId)
    .single();

  if (checkError || !existing || existing.owner_id !== user.id) {
    return { error: "Unauthorized: You do not own this resource." };
  }

  let images: string[] = Array.isArray(existing.images) ? (existing.images as string[]) : [];
  const imageFile = formData.get("image_file") as File | null;
  if (imageFile && imageFile.size > 0) {
    const uploadRes = await uploadResourceImage(imageFile, user.id);
    if (uploadRes.url) {
      images = [uploadRes.url, ...images];
    }
  }

  const baseUpdateData = {
    title,
    description,
    category,
    location,
    institution_id: institutionId || null,
    eligibility_requirements: eligibilityRequirements,
    usage_rules: usageRules,
    deposit_amount: depositAmount,
    currency,
    status,
    images,
    updated_at: new Date().toISOString(),
  };

  let { error: updateError } = await (
    supabase.from("resources") as any // eslint-disable-line @typescript-eslint/no-explicit-any
  )
    .update({
      ...baseUpdateData,
      resource_type: resourceType,
    })
    .eq("id", resourceId);

  // Schema resilience: Fallback if remote table lacks resource_type column
  if (updateError && updateError.message.includes("resource_type")) {
    console.warn("[ResourceAction] Fallback: resources table lacks resource_type column on update, retrying without it");
    const retry = await (supabase.from("resources") as any)
      .update(baseUpdateData)
      .eq("id", resourceId);
    updateError = retry.error;
  }

  if (updateError) {
    return { error: `Update failed: ${updateError.message}` };
  }

  // Update availability windows if passed
  const availabilityJson = formData.get("availability_json")?.toString();
  if (availabilityJson) {
    try {
      const windows = JSON.parse(availabilityJson) as {
        day_of_week: number;
        start_time: string;
        end_time: string;
      }[];

      // Delete old availability rows and re-insert
      await supabase.from("resource_availability").delete().eq("resource_id", resourceId);

      if (Array.isArray(windows) && windows.length > 0) {
        const rows = windows.map((w) => ({
          resource_id: resourceId,
          day_of_week: w.day_of_week,
          start_time: w.start_time,
          end_time: w.end_time,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST schema inference workaround
        await (supabase.from("resource_availability") as any).insert(rows);
      }
    } catch (e) {
      console.warn("[ResourceAction] Availability update notice:", e);
    }
  }

  revalidatePath(`/resources/${resourceId}`);
  revalidatePath("/my-resources");
  revalidatePath("/resources");
  revalidatePath("/");

  redirect("/my-resources");
}

/**
 * Toggles a resource's publication status (e.g. publish or archive).
 */
export async function setResourceStatusAction(
  resourceId: string,
  newStatus: ResourceStatus
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const { error } = await (
    supabase.from("resources") as any // eslint-disable-line @typescript-eslint/no-explicit-any
  )
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", resourceId)
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/resources/${resourceId}`);
  revalidatePath("/my-resources");
  revalidatePath("/resources");
  revalidatePath("/");

  return { success: true };
}
