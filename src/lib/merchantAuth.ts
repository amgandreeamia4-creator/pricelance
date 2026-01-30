// src/lib/merchantAuth.ts

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const MERCHANT_JWT_SECRET = process.env.MERCHANT_JWT_SECRET || 'merchant-secret-key';
const MERCHANT_SESSION_COOKIE = 'merchant_session';

export interface MerchantSession {
  merchantUserId: string;
  merchantId: string;
  email: string;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function createMerchantSession(
  merchantUserId: string, 
  merchantId: string, 
  email: string,
  response: NextResponse
): void {
  const token = jwt.sign(
    { merchantUserId, merchantId, email },
    MERCHANT_JWT_SECRET,
    { expiresIn: '7d' }
  );

  response.cookies.set(MERCHANT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export async function getMerchantSession(request: NextRequest): Promise<MerchantSession | null> {
  const token = request.cookies.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, MERCHANT_JWT_SECRET) as MerchantSession;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function clearMerchantSession(response: NextResponse): void {
  response.cookies.set(MERCHANT_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export function requireMerchantAuth(handler: (req: NextRequest, session: MerchantSession) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getMerchantSession(req);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req, session);
  };
}
