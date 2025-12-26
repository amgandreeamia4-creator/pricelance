// src/lib/adminAuth.ts

type AdminAuthError =
  | { error: "Missing admin token"; status: 500 }
  | { error: "Invalid admin token"; status: 401 };

/**
 * Validate the admin token sent in the x-admin-token header.
 * Uses ADMIN_TOKEN (preferred) and falls back to NEXT_PUBLIC_ADMIN_TOKEN
 * so that older client code still works as long as env vars match.
 */
export function validateAdminToken(headerToken: string | null): AdminAuthError | null {
  const expected =
    process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";

  if (!expected) {
    return { error: "Missing admin token", status: 500 };
  }

  if (!headerToken || headerToken !== expected) {
    return { error: "Invalid admin token", status: 401 };
  }

  return null;
}