import { NextRequest, NextResponse } from "next/server";

const BASIC_AUTH_PATHS = [
  "/admin",
  "/api/admin",
  "/api/internal",
  "/api/ingest",
];

function needsAuth(pathname: string): boolean {
  return BASIC_AUTH_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!needsAuth(pathname)) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return new NextResponse("Admin is not configured.", { status: 503 });
  }

  if (!authHeader?.startsWith("Basic ")) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
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

  const [username, password] = decoded.split(":");

  const isValid =
    username === "admin" &&
    typeof password === "string" &&
    password === secret;

  if (!isValid) {
    return new NextResponse("Invalid credentials", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
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
