// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASIC_AUTH_USER = process.env.ADMIN_BASIC_USER;
const BASIC_AUTH_PASS = process.env.ADMIN_BASIC_PASS;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export function middleware(req: NextRequest) {
  const { pathname, hostname } = req.nextUrl;

  // 🔴 ABSOLUTELY REQUIRED: skip Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap")
  ) {
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith("/admin");

  // Only guard admin pages
  if (!isAdminPage) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);

  // Local dev: no Basic Auth
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    if (ADMIN_TOKEN) {
      requestHeaders.set("x-admin-token", ADMIN_TOKEN);
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Production: HTTP Basic Auth
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return new Response("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
  }

  const decoded = Buffer.from(authHeader.split(" ")[1], "base64").toString(
    "utf8"
  );
  const [user, pass] = decoded.split(":");

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

  // Auth OK → inject admin token
  if (ADMIN_TOKEN) {
    requestHeaders.set("x-admin-token", ADMIN_TOKEN);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};