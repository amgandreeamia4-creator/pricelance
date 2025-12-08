// src/app/api/internal/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ingestProducts, type IngestPayload } from "@/lib/ingestService";
import { checkInternalAuth } from "@/lib/internalAuth";

export async function POST(req: NextRequest) {
  if ((process.env.NODE_ENV ?? "development") === "production") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 404 },
    );
  }

  const authError = checkInternalAuth(req);
  if (authError) return authError;

  try {
    const body = (await req.json()) as IngestPayload;
    const result = await ingestProducts(body);

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to ingest products:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  if ((process.env.NODE_ENV ?? "development") === "production") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 404 },
    );
  }

  const authError = checkInternalAuth(req);
  if (authError) return authError;

  // Simple health check
  return NextResponse.json({
    ok: true,
    message: "Internal ingest endpoint is alive",
  });
}
