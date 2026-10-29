import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  ResourceFilterParams,
  ResourceWithRelations,
  DbInstitution,
} from "../types";

/**
 * Retrieves public published resources with search, filter, and sorting.
 */
export async function getResources(
  filters: ResourceFilterParams = {}
): Promise<{
  resources: ResourceWithRelations[];
  totalCount: number;
}> {
  const supabase = await createClient();

  const {
    query,
    category,
    resourceType,
    institutionId,
    sort = "newest",
    page = 1,
    limit = 12,
  } = filters;

  let dbQuery = supabase
    .from("resources")
    .select(
      `
      *,
      institution:institutions (*),
      owner:profiles (
        id,
        full_name,
        avatar_url,
        role,
        verification_status
      )
    `,
      { count: "exact" }
    )
    .eq("status", "published");

  // Search by keyword in title or description
  if (query && query.trim() !== "") {
    const cleanQuery = query.trim();
    dbQuery = dbQuery.or(`title.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`);
  }

  // Filter by category
  if (category && category !== "All" && category !== "All Categories") {
    dbQuery = dbQuery.eq("category", category);
  }

  // Filter by resource type
  if (resourceType && resourceType !== "all") {
    dbQuery = dbQuery.eq("resource_type", resourceType);
  }

  // Filter by institution
  if (institutionId && institutionId !== "all") {
    dbQuery = dbQuery.eq("institution_id", institutionId);
  }

  // Sorting
  switch (sort) {
    case "title_asc":
      dbQuery = dbQuery.order("title", { ascending: true });
      break;
    case "deposit_asc":
      dbQuery = dbQuery.order("deposit_amount", { ascending: true });
      break;
    case "deposit_desc":
      dbQuery = dbQuery.order("deposit_amount", { ascending: false });
      break;
    case "newest":
    default:
      dbQuery = dbQuery.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, count, error } = await dbQuery;

  if (error) {
    console.error("[ResourceService] Error fetching resources:", error.message);
    return { resources: [], totalCount: 0 };
  }

  return {
    resources: (data as ResourceWithRelations[]) || [],
    totalCount: count || 0,
  };
}

/**
 * Retrieves a single resource by ID with full relations and availability schedules.
 * Non-published resources can only be retrieved by their owner or admin.
 */
export async function getResourceById(
  id: string,
  currentUserId?: string
): Promise<ResourceWithRelations | null> {
  const supabase = await createClient();

  const { data: resource, error } = await supabase
    .from("resources")
    .select(
      `
      *,
      institution:institutions (*),
      owner:profiles (
        id,
        full_name,
        avatar_url,
        role,
        verification_status
      ),
      availability:resource_availability (*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !resource) {
    return null;
  }

  const typedResource = resource as unknown as ResourceWithRelations;

  // Authorization check for draft or archived resources
  if (typedResource.status !== "published") {
    if (!currentUserId || typedResource.owner_id !== currentUserId) {
      // User is not the owner; do not reveal unpublished resource
      return null;
    }
  }

  return typedResource;
}

/**
 * Retrieves resources owned by a specific user (drafts, published, and archived).
 */
export async function getMyResources(userId: string): Promise<ResourceWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resources")
    .select(
      `
      *,
      institution:institutions (*),
      availability:resource_availability (*)
    `
    )
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[ResourceService] Error fetching user resources:", error.message);
    return [];
  }

  return (data as ResourceWithRelations[]) || [];
}

/**
 * Retrieves all institutions for dropdown selects (memoized per-request).
 */
export const getInstitutions = cache(async (): Promise<DbInstitution[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[ResourceService] Error fetching institutions:", error.message);
    return [];
  }

  return data || [];
});

/**
 * Count of published resources for overview metrics (memoized per-request).
 */
export const getPublishedResourceCount = cache(async (): Promise<number> => {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  if (error) return 0;
  return count || 0;
});
