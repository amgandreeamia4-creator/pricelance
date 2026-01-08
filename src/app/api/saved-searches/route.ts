// src/app/api/saved-searches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, type SavedSearch } from "@prisma/client";
import { randomUUID } from "crypto";
import { getOrCreateUserId, attachUserIdCookie } from "@/lib/userIdentity";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// GET /api/saved-searches
// Returns saved searches for the current anonymous user
export async function GET(req: NextRequest) {
  const { userId, shouldSetCookie } = getOrCreateUserId(req);

  try {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    let res: NextResponse;
    res = NextResponse.json(
      {
        ok: true,
        count: savedSearches.length,
        savedSearches: savedSearches.map((s: SavedSearch) => ({
          id: s.id,
          query: s.query,
          filters: s.filters,
          createdAt: s.createdAt,
        })),
      },
      { status: 200 }
    );

    if (shouldSetCookie) {
      res = attachUserIdCookie(res, userId);
    }

    return res;
  } catch (error) {
    console.error("[saved-searches] GET error:", error);
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

// POST /api/saved-searches
// Body: { query: string, filters?: any }
// Creates a new saved search for the current anonymous user
export async function POST(req: NextRequest) {
  try {
    const { userId, shouldSetCookie } = getOrCreateUserId(req);
    const body = await req.json();
    const query = body?.query as string | undefined;
    const filters = body?.filters ?? null;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid 'query'" },
        { status: 400 }
      );
    }

    const saved = await prisma.savedSearch.create({
      data: {
        id: randomUUID(),
        userId,
        query,
        filters,
      },
    });

    let res = NextResponse.json(
      {
        ok: true,
        savedSearch: {
          id: saved.id,
          query: saved.query,
          filters: saved.filters,
          createdAt: saved.createdAt,
        },
      },
      { status: 201 }
    );

    if (shouldSetCookie) {
      res = attachUserIdCookie(res, userId);
    }

    return res;
  } catch (error) {
    console.error("[saved-searches] POST error:", error);
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

// DELETE /api/saved-searches
// Body: { id: string }
// Deletes a saved search for the current anonymous user
export async function DELETE(req: NextRequest) {
  try {
    const { userId, shouldSetCookie } = getOrCreateUserId(req);
    const body = await req.json();
    const id = body?.id as string | undefined;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid 'id'" },
        { status: 400 }
      );
    }

    try {
      await prisma.savedSearch.delete({
        where: { id },
      });
    } catch (error: any) {
      // Record not found (Prisma error code P2025) -> 404
      if (error?.code === "P2025") {
        return NextResponse.json(
          { ok: false, error: "Saved search not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    let res = NextResponse.json(
      {
        ok: true,
        deleted: true,
        id,
      },
      { status: 200 }
    );

    if (shouldSetCookie) {
      res = attachUserIdCookie(res, userId);
    }

    return res;
  } catch (error: any) {
    console.error("[saved-searches] DELETE error:", error);
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
