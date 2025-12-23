// ADMIN_PASSWORD is the primary env var; ADMIN_SECRET is kept for backward compatibility
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || "";

// ADMIN_TOKEN is used for API route authentication via x-admin-token header
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

/**
 * Check if a provided key matches the admin password.
 * Used for query-param based auth in admin pages (legacy).
 * Note: In production, middleware handles HTTP Basic Auth before pages load.
 */
export function isAdminKeyValid(providedKey: string | undefined): boolean {
  if (!ADMIN_PASSWORD) return false;
  if (!providedKey) return false;
  return providedKey === ADMIN_PASSWORD;
}

/**
 * Check if admin auth is configured (password is set).
 */
export function isAdminAuthConfigured(): boolean {
  return !!ADMIN_PASSWORD;
}

/**
 * Validate admin API token from x-admin-token header.
 * Returns null if valid, or an error object if invalid.
 */
export function validateAdminToken(
  token: string | null
): { error: string; status: 401 | 403 } | null {
  if (!ADMIN_TOKEN) {
    return { error: "Admin API not configured", status: 403 };
  }
  if (!token) {
    return { error: "Missing x-admin-token header", status: 401 };
  }
  if (token !== ADMIN_TOKEN) {
    return { error: "Invalid admin token", status: 403 };
  }
  return null;
}

/**
 * Check if admin API token is configured.
 */
export function isAdminTokenConfigured(): boolean {
  return !!ADMIN_TOKEN;
}