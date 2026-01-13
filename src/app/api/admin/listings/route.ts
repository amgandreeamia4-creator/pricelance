// src/app/api/admin/listings/route.ts
// Admin API for creating listings
// Protected by Basic Auth middleware (/api/admin/*)
//
// Source values:
// - "manual" = created via /admin/manual-products (this route)
// - "sheet"  = created via Google Sheet / CSV pipeline
// - "affiliate" = created via affiliate adapters (future)

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { defaultCountryForStore, normalizeStoreName } from "@/lib/stores/registry";
import { validateAdminToken } from "@/lib/adminAuth";
import { isBlockedStoreOrUrl } from "@/lib/listingGuards";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/listings
 * Create a new listing for an existing product.
 * Body: {
 *   productId: string (required)
 *   storeId: string (required, e.g. "emag", "altex", "pcgarage", "flanco", "amazon_de", "other_eu")
 *   storeName: string (required)
 *   url?: string
 *   price: number (required)
 *   currency: string (required)
 *   fastDelivery?: boolean
 *   deliveryTimeDays?: number
 * }
 */
export async function POST(req: NextRequest) {
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status }
    );
  }

  try {
    const body = await req.json();

    // Validate required fields
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const storeId = typeof body.storeId === "string" ? body.storeId.trim() : "";
    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 }
      );
    }

    const storeNameRaw = typeof body.storeName === "string" ? body.storeName.trim() : "";
    if (!storeNameRaw) {
      return NextResponse.json(
        { error: "storeName is required" },
        { status: 400 }
      );
    }

    if (typeof body.price !== "number" || isNaN(body.price)) {
      return NextResponse.json(
        { error: "price is required and must be a number" },
        { status: 400 }
      );
    }
    const price = body.price;

    const currency = typeof body.currency === "string" ? body.currency.trim() : "";
    if (!currency) {
      return NextResponse.json(
        { error: "currency is required" },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 400 }
      );
    }

    // Optional fields
    const url = typeof body.url === "string" ? body.url.trim() || null : null;
    const fastDelivery = typeof body.fastDelivery === "boolean" ? body.fastDelivery : null;
    const deliveryTimeDays = typeof body.deliveryTimeDays === "number" ? body.deliveryTimeDays : null;

    const normalizedStoreName = normalizeStoreName(storeId, storeNameRaw);
    const countryCode =
      defaultCountryForStore(storeId, "RO") ?? "RO";

    // Check if listing should be blocked
    if (isBlockedStoreOrUrl(normalizedStoreName, url)) {
      console.warn("Skipping blocked listing for eMAG-like store/url", { 
        storeName: normalizedStoreName, 
        url 
      });
      return NextResponse.json(
        { error: "Listing blocked: store or URL matches eMAG patterns" },
        { status: 400 }
      );
    }

    // Relax Prisma typing for new metadata fields
    const listing = await (prisma.listing.create as any)({
      data: {
        id: randomUUID(),
        productId,
        storeName: normalizedStoreName,
        url,
        price,
        currency,
        fastDelivery,
        deliveryTimeDays,
        countryCode,
        source: "manual", // Mark as manually created via admin UI
        priceLastSeenAt: new Date(),
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("[admin/listings] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
