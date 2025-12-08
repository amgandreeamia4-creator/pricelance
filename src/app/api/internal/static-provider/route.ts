// src/app/api/internal/static-provider/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ingestProducts, normalizeProducts } from "@/lib/ingestService";
import { checkInternalAuth } from "@/lib/internalAuth";
import { staticProvider } from "@/lib/providers/staticProvider";

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
    const payload = await staticProvider.searchProducts("");
    const products = normalizeProducts(payload);

    const result = await ingestProducts(products);

    return NextResponse.json(
      {
        ok: true,
        source: "static",
        ingested: result.count,
        productIds: result.productIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[static-provider] GET error:", error);
    return NextResponse.json(
      {
        ok: false,
        source: "static",
        error: error instanceof Error ? error.message : String(error),
        ingested: 0,
      },
      { status: 500 }
    );
  }
}
