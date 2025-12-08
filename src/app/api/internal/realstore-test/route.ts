// src/app/api/internal/realstore-test/route.ts
// Health check endpoint for the RealStore (RapidAPI) provider.
// Does NOT write to the database - read-only diagnostic.

import { NextRequest, NextResponse } from "next/server";
import { checkInternalAuth } from "@/lib/internalAuth";
import { realStoreProvider } from "@/lib/providers/realStoreProvider";
import { normalizeProducts, type IngestProductInput } from "@/lib/ingestService";

interface RealStoreTestResponse {
  ok: boolean;
  query: string;
  durationMs: number;
  providerId: "realstore";
  status: number | null;
  itemsLength: number;
  sampleItem: {
    id: string;
    name: string;
    storeName: string | null;
    price: number | null;
    currency: string | null;
  } | null;
  error: {
    type: string;
    message: string;
    httpStatus?: number;
    stack?: string;
  } | null;
  config: {
    baseUrl: string | null;
    hasApiKey: boolean;
    timeoutMs: number;
  };
}

export async function GET(req: NextRequest): Promise<NextResponse<RealStoreTestResponse>> {
  // Auth check - same pattern as other internal routes
  const authError = checkInternalAuth(req);
  if (authError) return authError as NextResponse<RealStoreTestResponse>;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "iphone 15";

  // Gather config info for diagnostics
  const baseUrl = process.env.REALTIME_PRODUCT_SEARCH_BASE_URL || "https://real-time-product-search.p.rapidapi.com";
  const apiKey = process.env.REALTIME_PRODUCT_SEARCH_API_KEY;
  const timeoutMs = 20000; // Default timeout from provider config

  const config = {
    baseUrl,
    hasApiKey: !!apiKey,
    timeoutMs,
  };

  const started = Date.now();
  let itemsLength = 0;
  let sampleItem: RealStoreTestResponse["sampleItem"] = null;
  let errorInfo: RealStoreTestResponse["error"] = null;
  let httpStatus: number | null = null;

  try {
    // Use the existing searchProductsWithStatus method - does NOT ingest to DB
    const result = await realStoreProvider.searchProductsWithStatus!(query);

    if (result.error) {
      // Provider returned an error (timeout, network, http, parse, config)
      errorInfo = {
        type: result.error.type,
        message: result.error.message,
        httpStatus: result.error.httpStatus,
      };
      httpStatus = result.error.httpStatus ?? null;
    } else {
      // Success - extract sample data
      httpStatus = 200;
      
      // Flatten payloads to count items - each payload can be array or {products:[]}
      const allProducts: IngestProductInput[] = result.payloads.flatMap((payload) =>
        normalizeProducts(payload)
      );
      itemsLength = allProducts.length;

      if (allProducts.length > 0) {
        const first = allProducts[0];
        const firstListing = first.listings?.[0];
        sampleItem = {
          id: first.id ?? "unknown",
          name: first.name ?? first.displayName ?? "Unknown",
          storeName: firstListing?.storeName ?? null,
          price: firstListing?.price ?? null,
          currency: firstListing?.currency ?? null,
        };
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    errorInfo = {
      type: error?.name ?? "UnknownError",
      message: error?.message ?? String(err),
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    };
  }

  const durationMs = Date.now() - started;

  const response: RealStoreTestResponse = {
    ok: !errorInfo,
    query,
    durationMs,
    providerId: "realstore",
    status: httpStatus,
    itemsLength,
    sampleItem,
    error: errorInfo,
    config,
  };

  // Always return 200 so the JSON is always readable by clients
  // The `ok` field indicates whether the provider call succeeded
  return NextResponse.json(response, { status: 200 });
}
