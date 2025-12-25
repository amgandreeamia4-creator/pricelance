// middleware.ts
// HTTP Basic Auth for /admin/* routes.
// API routes (/api/admin/*) use x-admin-token header instead (handled in route handlers).

import { NextRequest, NextResponse } from "next/server";

const REALM = 'Basic realm="Restricted Area"';

function unauthorized(message = "Unauthorized"): NextResponse {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": REALM,
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin pages (not /api/admin which uses x-admin-token)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  // If these aren't configured, fail loudly so we don't get accidental open or broken auth.
  if (!expectedUser || !expectedPassword) {
    return new NextResponse(
      "Server configuration error: ADMIN_USER or ADMIN_PASSWORD is not set.",
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized("Authentication required");
  }

  const base64Credentials = authHeader.slice("Basic ".length).trim();

  let decoded: string;
  try {
    decoded = atob(base64Credentials);
  } catch {
    return unauthorized("Invalid authentication header");
  }

  // decoded is "username:password"
  const [username, ...rest] = decoded.split(":");
  const password = rest.join(":");

  if (username === expectedUser && password === expectedPassword) {
    return NextResponse.next();
  }

  return unauthorized("Invalid credentials");
}

// Configure which routes the middleware applies to.
export const config = {
  matcher: ["/admin/:path*"],
};
