// src/lib/userIdentity.ts
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "sp_user_id";

export type UserIdResult = {
  userId: string;
  shouldSetCookie: boolean;
};

/**
 * Reads the user id from cookies if present.
 * If missing, generates a new anonymous id.
 */
export function getOrCreateUserId(req: NextRequest): UserIdResult {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value) {
    return { userId: cookie.value, shouldSetCookie: false };
  }

  const newId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return { userId: newId, shouldSetCookie: true };
}

/**
 * Attaches the user id cookie to a response if needed.
 */
export function attachUserIdCookie(
  res: NextResponse,
  userId: string
): NextResponse {
  res.cookies.set(COOKIE_NAME, userId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: true,
    sameSite: "lax",
  });
  return res;
}
