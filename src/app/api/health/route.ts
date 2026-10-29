export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "healthy",
      service: "nexus-web",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
    { status: 200 }
  );
}
