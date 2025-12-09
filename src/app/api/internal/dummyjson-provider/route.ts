// src/app/api/internal/dummyjson-provider/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ingestProducts, normalizeProducts } from "@/lib/ingestService";
import { checkInternalAuth } from "@/lib/internalAuth";
import { dummyJsonProvider } from "@/lib/providers/dummyJsonProvider";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if ((process.env.NODE_ENV ?? "development") === "production") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 404 },
    );
  }

  const authError = checkInternalAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);

    const limitParam = searchParams.get("limit");
    const requestedLimit = limitParam ? Number(limitParam) : 100;
    const safeLimit =
      Number.isFinite(requestedLimit) &&
      requestedLimit > 0 &&
      requestedLimit <= 100
        ? requestedLimit
        : 100;

    // Delegate fetching + mapping to the shared provider implementation.
    const payloads = await dummyJsonProvider.searchProducts("", {
      limit: safeLimit,
    });
    const payload = payloads[0] ?? [];

    const products = normalizeProducts(payload);

    if (products.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No products returned from DummyJSON",
          ingested: 0,
          sourceCount: 0,
          productIds: [],
        },
        { status: 500 }
      );
    }

    const result = await ingestProducts(payload);

    return NextResponse.json(
      {
        ok: true,
        sourceCount: products.length,
        ingested: result.count,
        productIds: result.productIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[dummyjson-provider] Error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        ingested: 0,
      },
      { status: 500 }
    );
  }
}
