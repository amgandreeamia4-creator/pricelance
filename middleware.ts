// middleware.ts
// HTTP Basic Auth for /admin/* routes in production.
// API routes (/api/admin/*) use x-admin-token header instead (handled in route handlers).

import { NextRequest, NextResponse } from "next/server";

// Read admin credentials from env with fallbacks
const ADMIN_USER =
  process.env.ADMIN_USER ||
  process.env.BASIC_AUTH_USER ||
  "admin";

const ADMIN_PASS =
  process.env.ADMIN_PASSWORD ||
  process.env.ADMIN_SECRET ||
  process.env.ADMIN_TOKEN ||
  process.env.BASIC_AUTH_PASSWORD ||
  "";

/**
 * Middleware runs on matched routes before the page/API is rendered.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin pages (not /api/admin which uses x-admin-token)
  if (pathname.startsWith("/admin")) {
    // Skip Basic Auth if no password is configured (dev mode safety)
    if (!ADMIN_PASS) {
      return NextResponse.next();
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return unauthorizedResponse();
    }

    // Decode Base64 credentials
    const base64Credentials = authHeader.slice(6); // Remove "Basic "
    let credentials: string;
    try {
      credentials = atob(base64Credentials);
    } catch {
      return unauthorizedResponse();
    }

    const [user, pass] = credentials.split(":");

    if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
      return unauthorizedResponse();
    }

    // Credentials valid, proceed
    return NextResponse.next();
  }

  // For all other routes, just proceed
  return NextResponse.next();
}

/**
 * Return a 401 response with WWW-Authenticate header for Basic Auth prompt.
 */
function unauthorizedResponse(): NextResponse {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Restricted"',
    },
  });
}

/**
 * Configure which routes the middleware applies to.
 * We only need it for /admin/* pages.
 */
export const config = {
  matcher: ["/admin/:path*"],
};
