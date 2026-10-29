import { createClient } from "@/lib/supabase/server";
import type {
  MemberWithDetails,
  InstitutionMetrics,
  InstitutionLoanSummary,
  ActivityLogWithDetails,
} from "../types";
import { computeOverdueMetadata } from "@/features/bookings/services/booking-service";
import type { BookingWithRelations, DbIncident } from "@/features/bookings/types";

/**
 * Retrieves members of a specific institution, with optional verification/suspension filters and search.
 */
export async function getInstitutionMembers(
  institutionId: string,
  filter: string = "all",
  search?: string
): Promise<MemberWithDetails[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST select query
  let query = (supabase.from("profiles") as any)
    .select(
      `
      *,
      institution:institutions (*)
    `
    )
    .eq("institution_id", institutionId);

  if (filter === "pending") {
    query = query.eq("verification_status", "pending");
  } else if (filter === "unverified") {
    query = query.in("verification_status", ["unverified", "pending"]);
  } else if (filter === "verified") {
    query = query.eq("verification_status", "verified");
  } else if (filter === "suspended") {
    query = query.eq("is_suspended", true);
  } else if (filter === "custodians") {
    query = query.eq("role", "resource_owner");
  } else if (filter === "admins") {
    query = query.eq("role", "institution_admin");
  }

  if (search && search.trim()) {
    query = query.ilike("full_name", `%${search.trim()}%`);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error || !data) {
    console.error("[AdminService] Error fetching institution members:", error?.message);
    return [];
  }

  return data as MemberWithDetails[];
}

/**
 * Computes live, authorized governance metrics for an institution.
 */
export async function getInstitutionMetrics(institutionId: string): Promise<InstitutionMetrics> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  // Fetch resource IDs belonging to this institution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST query
  const { data: instResources } = await (supabase.from("resources") as any)
    .select("id")
    .eq("institution_id", institutionId);

  const resourceIds = (instResources || []).map((r: { id: string }) => r.id);

  // Parallel metric queries
  const [
    totalMembersRes,
    pendingVerifRes,
    suspendedRes,
    totalResourcesRes,
    activeLoansRes,
    overdueLoansRes,
    incidentsRes,
    pendingApprovalsRes,
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any)
      .select("id", { count: "exact", head: true })
      .eq("institution_id", institutionId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any)
      .select("id", { count: "exact", head: true })
      .eq("institution_id", institutionId)
      .eq("verification_status", "pending"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any)
      .select("id", { count: "exact", head: true })
      .eq("institution_id", institutionId)
      .eq("is_suspended", true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("resources") as any)
      .select("id", { count: "exact", head: true })
      .eq("institution_id", institutionId),
    resourceIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("bookings") as any)
          .select("id", { count: "exact", head: true })
          .in("resource_id", resourceIds)
          .in("status", ["approved", "checked_out"])
      : Promise.resolve({ count: 0 }),
    resourceIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("bookings") as any)
          .select("id", { count: "exact", head: true })
          .in("resource_id", resourceIds)
          .eq("status", "checked_out")
          .lt("end_time", nowIso)
      : Promise.resolve({ count: 0 }),
    resourceIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("incidents") as any)
          .select("id", { count: "exact", head: true })
          .in("resource_id", resourceIds)
          .in("status", ["open", "under_review", "awaiting_information"])
      : Promise.resolve({ count: 0 }),
    resourceIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from("bookings") as any)
          .select("id", { count: "exact", head: true })
          .in("resource_id", resourceIds)
          .eq("status", "requested")
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    totalMembers: totalMembersRes.count || 0,
    pendingVerifications: pendingVerifRes.count || 0,
    suspendedMembers: suspendedRes.count || 0,
    totalResources: totalResourcesRes.count || 0,
    activeLoans: activeLoansRes.count || 0,
    overdueLoans: overdueLoansRes.count || 0,
    unresolvedIncidents: incidentsRes.count || 0,
    pendingApprovals: pendingApprovalsRes.count || 0,
  };
}

/**
 * Retrieves all apparatus loans across the institution for active monitoring and overdue tracking.
 */
export async function getInstitutionLoans(
  institutionId: string,
  filter: string = "all"
): Promise<InstitutionLoanSummary[]> {
  const supabase = await createClient();

  // Find all resource IDs belonging to this institution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instResources } = await (supabase.from("resources") as any)
    .select("id")
    .eq("institution_id", institutionId);

  const resourceIds = (instResources || []).map((r: { id: string }) => r.id);
  if (resourceIds.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("bookings") as any)
    .select(
      `
      *,
      resource:resources (
        *,
        institution:institutions (*),
        owner:profiles (id, full_name, role)
      ),
      borrower:profiles!borrower_id (id, full_name, avatar_url, role, verification_status),
      condition_reports (*),
      incidents (*)
    `
    )
    .in("resource_id", resourceIds);

  const nowIso = new Date().toISOString();

  if (filter === "active") {
    query = query.in("status", ["approved", "checked_out"]);
  } else if (filter === "overdue") {
    query = query.eq("status", "checked_out").lt("end_time", nowIso);
  } else if (filter === "inspection") {
    query = query.eq("status", "returned");
  } else if (filter === "completed") {
    query = query.eq("status", "completed");
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error || !data) {
    console.error("[AdminService] Error fetching institution loans:", error?.message);
    return [];
  }

  return (data as BookingWithRelations[]).map(computeOverdueMetadata);
}

/**
 * Retrieves unresolved or all incidents for an institution's equipment.
 */
export async function getInstitutionIncidents(
  institutionId: string,
  onlyOpen: boolean = false
): Promise<DbIncident[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instResources } = await (supabase.from("resources") as any)
    .select("id")
    .eq("institution_id", institutionId);

  const resourceIds = (instResources || []).map((r: { id: string }) => r.id);
  if (resourceIds.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("incidents") as any)
    .select(
      `
      *,
      resource:resources (id, title, category),
      reporter:profiles!reporter_id (id, full_name, role)
    `
    )
    .in("resource_id", resourceIds);

  if (onlyOpen) {
    query = query.in("status", ["open", "under_review", "awaiting_information"]);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error || !data) return [];
  return data as DbIncident[];
}

/**
 * Retrieves auditable activity logs scoped by institution or user authorization.
 */
export async function getActivityLogs(options?: {
  institutionId?: string;
  actionCategory?: string;
  limit?: number;
}): Promise<ActivityLogWithDetails[]> {
  const supabase = await createClient();
  const limit = options?.limit || 50;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("activity_logs") as any)
    .select(
      `
      id,
      actor_id,
      resource_id,
      booking_id,
      action_type,
      details,
      created_at,
      actor:profiles!actor_id (id, full_name, avatar_url, role),
      resource:resources!resource_id (id, title, category),
      booking:bookings!booking_id (id, status, start_time, end_time)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.actionCategory && options.actionCategory !== "all") {
    if (options.actionCategory === "bookings") {
      query = query.ilike("action_type", "booking_%");
    } else if (options.actionCategory === "governance") {
      query = query.or("action_type.ilike.member_%,action_type.ilike.institution_%");
    } else if (options.actionCategory === "incidents") {
      query = query.ilike("action_type", "incident_%");
    } else if (options.actionCategory === "resources") {
      query = query.ilike("action_type", "resource_%");
    }
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("[AdminService] Error fetching activity logs:", error?.message);
    return [];
  }

  return data as ActivityLogWithDetails[];
}
