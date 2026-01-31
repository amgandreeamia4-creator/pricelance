import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured - if not, run in test mode
    const isDatabaseAvailable = !!process.env.DATABASE_URL;

    if (isDatabaseAvailable) {
      // Check database connectivity
      const dbConnected = await checkDatabaseConnection();
      if (!dbConnected) {
        return NextResponse.json(
          { error: "Database connection unavailable. Please try again later." },
          { status: 503 },
        );
      }
    }

    // Parse request body
    const body = await request.json();

    // Extract and validate fields
    const storeName = (body.storeName ?? "").trim();
    const website = (body.website ?? "").trim();
    const country = (body.country ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    // Basic validation
    if (!storeName || storeName.length < 2) {
      return NextResponse.json(
        { error: "Store name must be at least 2 characters long." },
        { status: 400 },
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    if (website && !website.startsWith("http")) {
      return NextResponse.json(
        {
          error:
            "Website must be a valid URL starting with http:// or https://",
        },
        { status: 400 },
      );
    }

    // Check if email already exists (skip if no database)
    if (isDatabaseAvailable) {
      try {
        const existingUser = await prisma.merchantUser.findUnique({
          where: { email },
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "A merchant account with this email already exists." },
            { status: 400 },
          );
        }
      } catch (dbError: any) {
        console.error("Database error checking existing user:", dbError);
        return NextResponse.json(
          { error: "Database error occurred. Please try again." },
          { status: 503 },
        );
      }
    } else {
      // Test mode - simulate duplicate email check
      if (email === "test@duplicate.com") {
        return NextResponse.json(
          { error: "A merchant account with this email already exists." },
          { status: 400 },
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique IDs
    const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const merchantUserId = `muser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create merchant and user in a transaction (or simulate in test mode)
    let result;

    if (isDatabaseAvailable) {
      try {
        result = await prisma.$transaction(async (tx: any) => {
          // Create merchant
          const merchant = await tx.merchant.create({
            data: {
              id: merchantId,
              storeName,
              website: website || null,
              country: country || null,
            },
          });

          // Create merchant user
          const merchantUser = await tx.merchantUser.create({
            data: {
              id: merchantUserId,
              merchantId: merchant.id,
              email,
              passwordHash,
            },
          });

          return { merchant, merchantUser };
        });
      } catch (txError: any) {
        console.error("Transaction error:", txError);

        if (txError.code === "P2002") {
          return NextResponse.json(
            { error: "A merchant account with this email already exists." },
            { status: 400 },
          );
        }

        return NextResponse.json(
          { error: "Failed to create merchant account. Please try again." },
          { status: 500 },
        );
      }
    } else {
      // Test mode - simulate successful creation
      console.log("Test mode: Would create merchant with data:", {
        merchantId,
        storeName,
        website: website || null,
        country: country || null,
        email,
        passwordHashed: true,
      });

      result = {
        merchant: { id: merchantId },
        merchantUser: { id: merchantUserId },
      };
    }

    return NextResponse.json(
      {
        success: true,
        message: isDatabaseAvailable
          ? "Merchant account created successfully"
          : "Test mode: Merchant account would be created successfully",
        merchantId: result.merchant.id,
        testMode: !isDatabaseAvailable,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Merchant signup error:", error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { error: "Invalid request format. Please check your data." },
        { status: 400 },
      );
    }

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A merchant account with this email already exists." },
        { status: 400 },
      );
    }

    // Handle database connection errors
    if (
      error.code === "P1001" ||
      error.code === "P1017" ||
      error.code === "P1000"
    ) {
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    // Handle validation errors
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Data validation error. Please check your input." },
        { status: 400 },
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "An unexpected error occurred during signup. Please try again.",
      },
      { status: 500 },
    );
  }
}
