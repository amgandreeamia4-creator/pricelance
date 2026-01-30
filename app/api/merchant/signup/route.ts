// app/api/merchant/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, createMerchantSession } from '@/lib/merchantAuth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, website, country, email, password } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.merchantUser.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create merchant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or find merchant
      let merchant = await tx.merchant.findFirst({
        where: { name }
      });

      if (!merchant) {
        merchant = await tx.merchant.create({
          data: {
            name,
            website: website || null,
            country: country || null,
          }
        });
      }

      // Create merchant user
      const user = await tx.merchantUser.create({
        data: {
          merchantId: merchant.id,
          email,
          passwordHash,
        }
      });

      return { merchant, user };
    });

    // Create session
    const response = NextResponse.json({
      message: 'Account created successfully',
      merchant: {
        id: result.merchant.id,
        name: result.merchant.name,
        website: result.merchant.website,
        country: result.merchant.country,
      }
    });

    createMerchantSession(
      result.user.id,
      result.merchant.id,
      result.user.email,
      response
    );

    return response;
  } catch (error) {
    console.error('Merchant signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
