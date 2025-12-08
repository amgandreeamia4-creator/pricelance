// src/lib/internalAuth.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Simple guard for internal-only API routes.
 *
 * Usage in a route:
 *   const authError = checkInternalAuth(req);
 *   if (authError) return authError;
 */
export function checkInternalAuth(req: NextRequest): NextResponse | null {
  const expectedKey = process.env.INTERNAL_API_KEY;

  // If no key is configured, fail CLOSED in production, but allow in dev
  if (!expectedKey) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, error: "Internal API is not configured." },
        { status: 500 }
      );
    }
    // In development with no key set, allow the request.
    return null;
  }

  const headerKey = req.headers.get("x-internal-key");

  if (!headerKey || headerKey !== expectedKey) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized internal API call." },
      { status: 401 }
    );
  }

  return null;
}
