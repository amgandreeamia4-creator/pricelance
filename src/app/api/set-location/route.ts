import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { countryCode } = body;

    // Validate countryCode - should be string or null/undefined for global
    if (countryCode !== undefined && countryCode !== null && typeof countryCode !== 'string') {
      return NextResponse.json(
        { error: "Invalid countryCode format" },
        { status: 400 }
      );
    }

    // Set cookie with location preference
    // If countryCode is null/undefined/empty, delete the cookie (global mode)
    const cookieValue = countryCode && countryCode.trim() ? countryCode.trim().toLowerCase() : '';
    
    const response = NextResponse.json({ 
      success: true, 
      location: cookieValue || null 
    });

    if (cookieValue) {
      // Set location cookie for 30 days
      response.cookies.set('userLocation', cookieValue, {
        httpOnly: false, // Allow client-side access for UI state
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    } else {
      // Delete cookie for global mode
      response.cookies.set('userLocation', '', {
        path: '/',
        maxAge: 0, // Immediately expire
      });
    }

    return response;
  } catch (error) {
    console.error('Error setting location:', error);
    return NextResponse.json(
      { error: "Failed to set location" },
      { status: 500 }
    );
  }
}
