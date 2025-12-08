// src/app/api/internal/run-providers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkInternalAuth } from "@/lib/internalAuth";

export const dynamic = "force-dynamic";

type ProviderResult = {
  ok: boolean;
  ingested?: number;
  productIds?: string[];
  error?: string;
};

async function callProvider(path: string, internalKey: string | null): Promise<ProviderResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const headers: Record<string, string> = {};
    if (internalKey) {
      headers["x-internal-key"] = internalKey;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers,
    });

    const json = (await res.json()) as any;

    return {
      ok: json.ok ?? res.ok,
      ingested: json.ingested ?? 0,
      productIds: json.productIds ?? [],
      error: json.error,
    };
  } catch (error) {
    console.error(`[run-providers] Failed to call ${path}:`, error);
    return {
      ok: false,
      ingested: 0,
      productIds: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Not available in production" },
      { status: 404 },
    );
  }

  const authError = checkInternalAuth(req);
  if (authError) return authError;

  const providers = [
    { name: "demo-provider", path: "/api/internal/demo-provider" },
    { name: "dummyjson-provider", path: "/api/internal/dummyjson-provider" },
    { name: "static-provider", path: "/api/internal/static-provider" },
  ];

  const results: Record<string, ProviderResult> = {};
  let totalIngested = 0;
  const allProductIds: string[] = [];

  const headerKey = req.headers.get("x-internal-key");

  for (const provider of providers) {
    const result = await callProvider(provider.path, headerKey);
    results[provider.name] = result;

    if (result.ok) {
      totalIngested += result.ingested ?? 0;
      if (result.productIds && Array.isArray(result.productIds)) {
        allProductIds.push(...result.productIds);
      }
    }
  }

  const ok = Object.values(results).some((r) => r.ok);

  return NextResponse.json(
    {
      ok,
      totalIngested,
      uniqueProductIds: Array.from(new Set(allProductIds)),
      providers: results,
    },
    { status: ok ? 200 : 500 }
  );
}
