import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

const MERCHANT_JWT_SECRET =
  process.env.MERCHANT_JWT_SECRET || "merchant-secret-dev";
const MERCHANT_COOKIE_NAME = "merchant_session";

export interface MerchantSession {
  merchantId: string;
  merchantUserId: string;
  email: string;
}

export interface MerchantWithUser {
  id: string;
  storeName: string;
  website: string | null;
  country: string | null;
  users: Array<{
    id: string;
    email: string;
  }>;
}

/**
 * Get the current merchant session from cookies
 */
export async function getMerchantSession(): Promise<MerchantSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(MERCHANT_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, MERCHANT_JWT_SECRET) as MerchantSession;
    return decoded;
  } catch (error) {
    console.error("Error verifying merchant token:", error);
    return null;
  }
}

/**
 * Get the full merchant data for the current session
 */
export async function getCurrentMerchant(): Promise<MerchantWithUser | null> {
  const session = await getMerchantSession();
  if (!session) {
    return null;
  }

  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: session.merchantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return merchant;
  } catch (error) {
    console.error("Error fetching merchant:", error);
    return null;
  }
}

/**
 * Create a JWT token for a merchant user
 */
export function createMerchantToken(
  merchantId: string,
  merchantUserId: string,
  email: string,
): string {
  const payload: MerchantSession = {
    merchantId,
    merchantUserId,
    email,
  };

  return jwt.sign(payload, MERCHANT_JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Set the merchant session cookie
 */
export async function setMerchantSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(MERCHANT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Clear the merchant session cookie
 */
export async function clearMerchantSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(MERCHANT_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Validate merchant signup data
 */
export function validateSignupData(data: any): {
  isValid: boolean;
  errors: string[];
  cleaned?: {
    storeName: string;
    website?: string;
    country?: string;
    email: string;
    password: string;
  };
} {
  const errors: string[] = [];

  if (
    !data.storeName ||
    typeof data.storeName !== "string" ||
    data.storeName.trim().length < 2
  ) {
    errors.push("Store name must be at least 2 characters long");
  }

  if (
    !data.email ||
    typeof data.email !== "string" ||
    !isValidEmail(data.email)
  ) {
    errors.push("Valid email is required");
  }

  if (
    !data.password ||
    typeof data.password !== "string" ||
    data.password.length < 6
  ) {
    errors.push("Password must be at least 6 characters long");
  }

  if (
    data.website &&
    typeof data.website === "string" &&
    data.website.trim() &&
    !isValidUrl(data.website)
  ) {
    errors.push("Website must be a valid URL");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    cleaned: {
      storeName: data.storeName.trim(),
      website: data.website?.trim() || undefined,
      country: data.country?.trim() || undefined,
      email: data.email.toLowerCase().trim(),
      password: data.password,
    },
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
