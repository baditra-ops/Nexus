import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getResourceRecommendations } from "@/features/ai/services/ai-service";

export async function POST(req: NextRequest) {
  const { user } = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to request AI recommendations." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    if (!body.purposeDescription || typeof body.purposeDescription !== "string" || body.purposeDescription.trim().length < 3) {
      return NextResponse.json(
        { error: "Invalid purpose description. Must be at least 3 characters." },
        { status: 400 }
      );
    }

    const result = await getResourceRecommendations({
      purposeDescription: body.purposeDescription,
      category: body.category,
      requiredSpecifications: body.requiredSpecifications,
      requestedStartTime: body.requestedStartTime,
      requestedEndTime: body.requestedEndTime,
      maxDeposit: body.maxDeposit,
      preferredLocation: body.preferredLocation,
      preferredInstitutionId: body.preferredInstitutionId,
      crossInstitutionAllowed: body.crossInstitutionAllowed,
      limit: body.limit,
    });

    if (!result.isAvailable) {
      return NextResponse.json(
        { error: result.error, isAvailable: false },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
