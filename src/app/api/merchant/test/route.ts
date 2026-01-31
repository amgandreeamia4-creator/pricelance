import { NextRequest, NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const hasDbUrl = !!process.env.DATABASE_URL;
    let dbConnected = false;
    let dbError = null;

    if (hasDbUrl) {
      try {
        dbConnected = await checkDatabaseConnection();
      } catch (error: any) {
        dbError = error.message;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Merchant API routes are working",
      timestamp: new Date().toISOString(),
      database: {
        hasUrl: hasDbUrl,
        connected: dbConnected,
        status: hasDbUrl
          ? dbConnected
            ? "connected"
            : "failed"
          : "not_configured",
        error: dbError,
      },
      environment: process.env.NODE_ENV,
      testMode: !hasDbUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Test endpoint error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      message: "POST request received successfully",
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to parse JSON",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }
}
