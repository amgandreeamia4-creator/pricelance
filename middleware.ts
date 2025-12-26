// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASIC_AUTH_USER = process.env.ADMIN_BASIC_USER;
const BASIC_AUTH_PASS = process.env.ADMIN_BASIC_PASS;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, hostname } = url;

  // 🔓 1) Completely skip auth for localhost/dev
  // This unblocks you while we debug envs; production stays protected.
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return NextResponse.next();
  }

  // 🔒 2) Only protect /admin on real domains (Vercel / custom)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

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

  return NextResponse.next();
}

// Only run middleware on /admin paths
export const config = {
  matcher: ["/admin/:path*"],
};