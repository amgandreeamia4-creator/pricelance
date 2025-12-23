// src/app/api/admin/products/route.ts
// Admin API for listing and creating products (no auth for internal use)

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { validateAdminToken } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/products
 * Returns products with pagination and listing counts.
 * Query params: page (default 1), pageSize (default 20)
 */
export async function GET(req: NextRequest) {
  const authError = validateAdminToken(req.headers.get("x-admin-token"));
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status }
    );
  }

  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10)));
    const skip = (page - 1) * pageSize;

    // Get total count
    const total = await prisma.product.count();

    // Get paginated products with listing counts
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        brand: true,
        category: true,
        imageUrl: true,
        _count: {
          select: { listings: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    });

    // Flatten _count to listingsCount
    const result = products.map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      brand: p.brand,
      category: p.category,
      imageUrl: p.imageUrl,
      listingsCount: p._count.listings,
    }));

    return NextResponse.json({
      products: result,
      page,
      pageSize,
      total,
    });
  } catch (error) {
    console.error("[admin/products] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Create a new product.
 * Body: { name: string; displayName?: string; brand?: string; category?: string; imageUrl?: string; }
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

    // Validate required field
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Optional fields (must be strings or undefined)
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() || null : null;
    const brand =
      typeof body.brand === "string" ? body.brand.trim() || null : null;
    const category =
      typeof body.category === "string" ? body.category.trim() || null : null;
    const imageUrl =
      typeof body.imageUrl === "string" ? body.imageUrl.trim() || null : null;

    const product = await prisma.product.create({
      data: {
        id: randomUUID(),
        name,
        displayName,
        brand,
        category,
        imageUrl,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[admin/products] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
