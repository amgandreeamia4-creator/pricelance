import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Clear the merchant session cookie
    const cookieStore = await cookies();
    cookieStore.set("merchant_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Merchant logout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
