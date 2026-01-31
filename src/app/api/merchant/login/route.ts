import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { comparePassword, createMerchantToken } from "@/lib/merchantAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find merchant user
    const merchantUser = await prisma.merchantUser.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        merchant: true,
      },
    });

    if (!merchantUser) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      password,
      merchantUser.passwordHash,
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Create JWT token
    const token = createMerchantToken(
      merchantUser.merchantId,
      merchantUser.id,
      merchantUser.email,
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("merchant_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json(
      {
        message: "Login successful",
        merchant: {
          id: merchantUser.merchant.id,
          storeName: merchantUser.merchant.storeName,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Merchant login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
