// src/lib/adminAuth.ts
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_auth";

/**
 * Returns true if this request has a valid admin cookie.
 * In production we treat admin_auth=1 as "logged in".
 * The real password check happens in /admin/login (POST).
 */
export function isAdminRequestAuthenticated(): boolean {
  const store = cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  return token === "1";
}