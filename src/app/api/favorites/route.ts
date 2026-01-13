// @ts-nocheck
// src/app/api/favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getOrCreateUserId, attachUserIdCookie } from "@/lib/userIdentity";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/favorites
// Returns the list of favorites for the current anonymous user, including product + listings + price history
export async function GET(req: NextRequest) {
  const { userId, shouldSetCookie } = getOrCreateUserId(req);

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        Product: {
          include: {
            Listing: true,
            ProductPriceHistory: true,
          },
        },
      },
    });

    let res: NextResponse;
    res = NextResponse.json(
      {
        ok: true,
        count: favorites.length,
        favorites: favorites.map((f: any) => ({
          productId: f.productId,
          createdAt: f.createdAt,
          product: f.Product,
        })),
      },
      { status: 200 }
    );

    if (shouldSetCookie) {
      res = attachUserIdCookie(res, userId);
    }

    return res;
  } catch (error) {
    console.error("[favorites] GET error:", error);
    const res: NextResponse = NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
    return res;
  }
}

// POST /api/favorites
// Body: { productId: string }
// Adds (or keeps) a favorite for the demo user
export async function POST(req: NextRequest) {
  try {
    const { userId, shouldSetCookie } = getOrCreateUserId(req);
    const body = await req.json();
    const productId = body?.productId as string | undefined;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid productId" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        userId,
        productId,
      },
    });

    let res = NextResponse.json(
      {
        ok: true,
        favorite: {
          productId: favorite.productId,
          createdAt: favorite.createdAt,
        },
      },
      { status: 201 }
    );

    if (shouldSetCookie) {
      res = attachUserIdCookie(res, userId);
    }

    return res;
  } catch (error) {
    console.error("[favorites] POST error:", error);
    const res = NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
    return res;
  }
}

// DELETE /api/favorites
// Body: { productId: string }
// Removes a favorite for the demo user
export async function DELETE(req: NextRequest) {
  try {
    const { userId, shouldSetCookie } = getOrCreateUserId(req);
    const body = await req.json();
    const productId = body?.productId as string | undefined;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid productId" },
        { status: 400 }
      );
    }

    try {
      await prisma.favorite.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
    } catch (error: any) {
      // Record not found (Prisma error code P2025) -> treat as 404
      if (error?.code === "P2025") {
        return NextResponse.json(
          {
            ok: false,
            error: "Favorite not found",
          },
          { status: 404 }
        );
      }
      throw error;
    }

    let res = NextResponse.json(
      {
        ok: true,
        deleted: true,
        productId,
      },
      { status: 200 }
    );

    if (shouldSetCookie) {
      res = attachUserIdCookie(res, userId);
    }

    return res;
  } catch (error: any) {
    console.error("[favorites] DELETE error:", error);

    const res = NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
    return res;
  }
}
