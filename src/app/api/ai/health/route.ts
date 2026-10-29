import { NextResponse } from "next/server";
import { checkAIReadiness } from "@/features/ai/services/ai-service";

export async function GET() {
  const readiness = await checkAIReadiness();
  return NextResponse.json(readiness, {
    status: readiness.isOnline ? 200 : 503,
  });
}
