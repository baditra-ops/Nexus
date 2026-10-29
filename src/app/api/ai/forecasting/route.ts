import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getDemandForecast } from "@/features/ai/services/ai-service";

export async function POST(req: NextRequest) {
  const { user, profile } = await getCurrentUser();
  if (!user || !profile) {
    return NextResponse.json(
      { error: "Authentication required to access demand forecasting." },
      { status: 401 }
    );
  }

  if (profile.role !== "institution_admin" && profile.role !== "resource_owner") {
    return NextResponse.json(
      { error: "Access restricted: Only institutional administrators and resource owners can view demand forecasts." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await getDemandForecast({
      forecastTarget: body.forecastTarget || "category",
      targetIdentifier: body.targetIdentifier,
      forecastHorizonDays: typeof body.forecastHorizonDays === "number" ? body.forecastHorizonDays : 14,
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
