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
  const configuredTokens = new Set<string>([
    process.env.ADMIN_TOKEN,
    process.env.ADMIN_TOKEN_ROTATION,
  ].filter((value): value is string => Boolean(value && value.trim())));

  if (configuredTokens.size === 0) {
    return { error: "Missing admin token", status: 500 };
  }

  if (!headerToken || !configuredTokens.has(headerToken)) {
    return { error: "Invalid admin token", status: 401 };
  }

  return null;
}