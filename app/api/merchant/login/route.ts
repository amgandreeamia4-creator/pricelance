// app/api/merchant/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, createMerchantSession } from '@/lib/merchantAuth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with merchant
    const user = await prisma.merchantUser.findUnique({
      where: { email },
      include: { merchant: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const response = NextResponse.json({
      message: 'Login successful',
      merchant: {
        id: user.merchant.id,
        name: user.merchant.name,
        website: user.merchant.website,
        country: user.merchant.country,
      }
    });

    createMerchantSession(
      user.id,
      user.merchant.id,
      user.email,
      response
    );

    return response;
  } catch (error) {
    console.error('Merchant login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
