// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASIC_AUTH_USER = process.env.ADMIN_BASIC_USER;
const BASIC_AUTH_PASS = process.env.ADMIN_BASIC_PASS;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, hostname } = url;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  // Only guard admin pages and admin API routes
  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  const adminToken = process.env.ADMIN_TOKEN;

  // In local dev, skip Basic Auth but still attach admin token if present
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    if (adminToken) {
      requestHeaders.set("x-admin-token", adminToken);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Production / non-localhost: enforce Basic Auth
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new Response("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
  }

  const base64 = authHeader.split(" ")[1] ?? "";
  const [user, pass] = Buffer.from(base64, "base64")
    .toString("utf8")
    .split(":");

  // If envs are missing in prod, fail closed (401)
  if (!BASIC_AUTH_USER || !BASIC_AUTH_PASS) {
    return new Response("Admin credentials not configured", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
  }

  if (user !== BASIC_AUTH_USER || pass !== BASIC_AUTH_PASS) {
    return new Response("Invalid credentials", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
  }

  if (adminToken) {
    requestHeaders.set("x-admin-token", adminToken);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Run middleware on admin pages and admin API routes
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};