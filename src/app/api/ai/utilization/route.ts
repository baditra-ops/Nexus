import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getUtilizationInsights } from "@/features/ai/services/ai-service";

export async function POST(req: NextRequest) {
  const { user, profile } = await getCurrentUser();
  if (!user || !profile) {
    return NextResponse.json(
      { error: "Authentication required to access utilization analytics." },
      { status: 401 }
    );
  }

  if (profile.role !== "institution_admin" && profile.role !== "resource_owner") {
    return NextResponse.json(
      { error: "Access restricted: Only institutional administrators and resource owners can view utilization insights." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await getUtilizationInsights({
      timeWindowDays: typeof body.timeWindowDays === "number" ? body.timeWindowDays : 30,
      category: body.category,
      underutilizedThreshold: body.underutilizedThreshold,
      overutilizedThreshold: body.overutilizedThreshold,
      demoMode: Boolean(body.demoMode),
    });

    if (result.insufficientData) {
      return NextResponse.json(result, { status: 422 });
    }

    if (!result.isAvailable) {
      return NextResponse.json(result, { status: 503 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
