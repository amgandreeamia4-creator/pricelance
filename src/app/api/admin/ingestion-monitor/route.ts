import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/lib/adminAuth";
import { getIngestionDashboardData } from "@/lib/ingestionMonitoring";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
  }

  try {
    const data = await getIngestionDashboardData();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    console.error("[api/admin/ingestion-monitor] GET error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load ingestion monitoring data" },
      { status: 500 },
    );
  }
}
