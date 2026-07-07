// src/lib/adminAuth.ts

type AdminAuthError =
  | { error: "Missing admin token"; status: 500 }
  | { error: "Invalid admin token"; status: 401 };

/**
 * Validate the admin token sent in the x-admin-token header.
 * Only `ADMIN_TOKEN` (server-side) is accepted. Client-side `NEXT_PUBLIC_*`
 * values are ignored to prevent exposing secrets to the browser.
 */
export function validateAdminToken(headerToken: string | null): AdminAuthError | null {
  const expected = process.env.ADMIN_TOKEN || "";

  if (!expected) {
    return { error: "Missing admin token", status: 500 };
  }

  if (!headerToken || headerToken !== expected) {
    return { error: "Invalid admin token", status: 401 };
  }

  return null;
}