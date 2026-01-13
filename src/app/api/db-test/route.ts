import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  console.log("[/api/db-test] start", {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  });

  try {
    const result =
      await prisma.$queryRaw<{ result: number }[]>`SELECT 1 AS result`;
    const elapsed = Date.now() - startedAt;

    console.log("[/api/db-test] success", { elapsedMs: elapsed, result });

    return NextResponse.json({
      ok: true,
      elapsedMs: elapsed,
      result,
    });
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    console.error("[/api/db-test] error", {
      elapsedMs: elapsed,
      error,
    });

    return NextResponse.json(
      {
        ok: false,
        elapsedMs: elapsed,
        error:
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}