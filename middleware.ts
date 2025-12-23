// middleware.ts
// Pre-affiliate hardening: Simple ENV-driven HTTP Basic Auth guard for admin routes.
// Protects /admin/* pages and /api/admin/* routes.
//
// Configuration:
// - Set ADMIN_USER and ADMIN_PASSWORD env vars to enable authentication.
// - If neither is set, admin routes are accessible without auth (development mode).

import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

/**
 * Parses HTTP Basic Auth header and returns { user, pass } or null if invalid/missing.
 */
function parseBasicAuth(
  authHeader: string | null
): { user: string; pass: string } | null {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }

  try {
    const base64Credentials = authHeader.slice(6); // Remove "Basic "
    const credentials = atob(base64Credentials);
    const [user, ...passParts] = credentials.split(":");
    const pass = passParts.join(":"); // Handle passwords with colons

    if (!user) return null;
    return { user, pass };
  } catch {
    return null;
  }
}

/**
 * Returns a 401 Unauthorized response with WWW-Authenticate header.
 */
function unauthorizedResponse(): NextResponse {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PriceLance Admin"',
      "Content-Type": "text/plain",
    },
  });
}

export function middleware(req: NextRequest) {
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Development mode: if neither env var is set, allow access without auth
  if (!adminUser && !adminPassword) {
    return NextResponse.next();
  }

  // Production mode: require HTTP Basic Auth
  const authHeader = req.headers.get("authorization");
  const credentials = parseBasicAuth(authHeader);

  if (!credentials) {
    return unauthorizedResponse();
  }

  // Validate credentials
  const isValidUser = credentials.user === adminUser;
  const isValidPass = credentials.pass === adminPassword;

  if (!isValidUser || !isValidPass) {
    return unauthorizedResponse();
  }

  // Credentials valid - allow request to proceed
  return NextResponse.next();
}
