// src/app/api/admin/products/[productId]/listings/route.ts
// Admin API for listing and creating listings for a specific product

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { validateAdminToken } from "@/lib/adminAuth";
import { defaultCountryForStore, normalizeStoreName } from "@/lib/stores/registry";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

/**
 * GET /api/admin/products/[productId]/listings
 * Returns all listings for a given product.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  // Auth check
  const token = req.headers.get("x-admin-token");
  const authError = validateAdminToken(token);
  if (authError) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status }
    );
  }

  const { productId } = await context.params;

  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const listings = await prisma.listing.findMany({
      where: { productId },
      select: {
        id: true,
        storeName: true,
        storeLogoUrl: true,
        url: true,
        price: true,
        currency: true,
        fastDelivery: true,
        deliveryTimeDays: true,
        inStock: true,
        shippingCost: true,
        location: true,
        countryCode: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        ok: true,
        productId,
        productName: product.name,
        listings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[admin/products/listings] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products/[productId]/listings
 * Create a new listing for the product.
 * Body: {
 *   storeName (required),
 *   url (required, must be non-empty),
 *   price (required),
 *   currency (required),
 *   fastDelivery?, deliveryTimeDays?, inStock?, shippingCost?, location?, countryCode?
 * }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  // Auth check
  const token = req.headers.get("x-admin-token");
  const authError = validateAdminToken(token);
  if (authError) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status }
    );
  }

  const { productId } = await context.params;

  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Required fields validation
    const storeName =
      typeof body.storeName === "string" ? body.storeName.trim() : "";
    if (!storeName) {
      return NextResponse.json(
        { ok: false, error: "storeName is required" },
        { status: 400 }
      );
    }

    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "url is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Validate URL format (basic check)
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { ok: false, error: "url must be a valid URL" },
        { status: 400 }
      );
    }

    const price = typeof body.price === "number" ? body.price : null;
    if (price === null || price < 0) {
      return NextResponse.json(
        { ok: false, error: "price is required and must be a non-negative number" },
        { status: 400 }
      );
    }

    const currency =
      typeof body.currency === "string" ? body.currency.trim() : "";
    if (!currency) {
      return NextResponse.json(
        { ok: false, error: "currency is required" },
        { status: 400 }
      );
    }

    // Optional fields
    const fastDelivery =
      typeof body.fastDelivery === "boolean" ? body.fastDelivery : null;
    const deliveryTimeDays =
      typeof body.deliveryTimeDays === "number" ? body.deliveryTimeDays : null;
    const inStock =
      typeof body.inStock === "boolean" ? body.inStock : true;
    const shippingCost =
      typeof body.shippingCost === "number" ? body.shippingCost : null;
    const location =
      typeof body.location === "string" ? body.location.trim() || null : null;
    const storeLogoUrl =
      typeof body.storeLogoUrl === "string" ? body.storeLogoUrl.trim() || null : null;

    // Use store registry to normalize store name and default country code
    const storeId = typeof body.storeId === "string" ? body.storeId.trim() : "";
    const normalizedStoreName = storeId
      ? normalizeStoreName(storeId, storeName)
      : storeName;
    const rawCountryCode =
      typeof body.countryCode === "string" ? body.countryCode.trim().toUpperCase() : "";
    const countryCode = rawCountryCode || defaultCountryForStore(storeId, "RO") || "RO";

    const listing = await prisma.listing.create({
      data: {
        id: randomUUID(),
        productId,
        storeName: normalizedStoreName,
        url,
        price,
        currency,
        fastDelivery,
        deliveryTimeDays,
        inStock,
        shippingCost,
        location,
        countryCode,
        storeLogoUrl,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        listing: {
          id: listing.id,
          storeName: listing.storeName,
          url: listing.url,
          price: listing.price,
          currency: listing.currency,
          fastDelivery: listing.fastDelivery,
          deliveryTimeDays: listing.deliveryTimeDays,
          inStock: listing.inStock,
          shippingCost: listing.shippingCost,
          location: listing.location,
          countryCode: listing.countryCode,
          createdAt: listing.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[admin/products/listings] POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
