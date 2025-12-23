import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/admin",
  "/api/admin",
  "/api/internal",
  "/api/ingest",
];

function needsAuth(pathname: string): boolean {
  return PROTECTED_PATHS.some((prefix) => pathname.startsWith(prefix));
}

// Track whether we've logged the "gate disabled" warning (avoid spam)
let gateDisabledWarningLogged = false;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect specific paths
  if (!needsAuth(pathname)) {
    return NextResponse.next();
  }

  const isProduction = process.env.NODE_ENV === "production";

  // In development: bypass the gate entirely
  if (!isProduction) {
    return NextResponse.next();
  }

  // --- Production only below ---

  const adminPassword = process.env.ADMIN_PASSWORD;

  // Fail open if ADMIN_PASSWORD is not configured (with warning)
  if (!adminPassword) {
    if (!gateDisabledWarningLogged) {
      console.warn(
        "[proxy] ⚠️ ADMIN_PASSWORD not set - admin gate is DISABLED. " +
        "Set ADMIN_PASSWORD env var to protect /admin/* routes in production."
      );
      gateDisabledWarningLogged = true;
    }
    return NextResponse.next();
  }

  // HTTP Basic Auth check
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="PriceLance Admin"',
      },
    });
  }

  const base64Credentials = authHeader.replace("Basic ", "").trim();
  let decoded: string;

  try {
    decoded = Buffer.from(base64Credentials, "base64").toString("utf-8");
  } catch {
    return new NextResponse("Invalid authentication header", { status: 400 });
  }

  // Format: "username:password" - we only check the password
  // Username can be anything (commonly "admin" but not enforced)
  const colonIndex = decoded.indexOf(":");
  const password = colonIndex >= 0 ? decoded.slice(colonIndex + 1) : "";

  // Constant-time-ish comparison to avoid timing attacks
  const isValid =
    typeof password === "string" &&
    password.length === adminPassword.length &&
    password === adminPassword;

  if (!isValid) {
    // Log failed attempt without revealing the password
    console.warn(
      `[proxy] Failed admin auth attempt for ${pathname} ` +
      `(password length: ${password.length}, expected: ${adminPassword.length})`
    );
    return new NextResponse("Invalid credentials", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="PriceLance Admin"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/internal/:path*",
    "/api/ingest/:path*",
  ],
};
