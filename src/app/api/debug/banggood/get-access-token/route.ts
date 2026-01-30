/**
 * app/api/debug/banggood/get-access-token/route.ts
 *
 * Debug API route for testing Banggood API credentials and access token generation.
 * This endpoint provides detailed information about the API response for debugging purposes.
 * 
 * To use this endpoint:
 * 1. Open .env.local at the project root.
 * 2. Replace the placeholders for BANGGOOD_API_KEY and BANGGOOD_API_SECRET with your real Banggood App key and App secret.
 * 3. Restart the dev server, then visit /api/debug/banggood/get-access-token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { banggoodGetAccessToken, BanggoodResponse } from '../../../../../lib/affiliates/banggood';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET handler for Banggood access token debug endpoint
 * 
 * @param request - Next.js request object
 * @returns JSON response with detailed debug information
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Call Banggood API to get access token
    const result = await banggoodGetAccessToken();

    // Determine if the request was successful
    // According to Banggood API documentation, code === 200 indicates success
    const isHttpSuccess = result.httpStatus === 200;
    const isBanggoodSuccess = result.json?.code === 200;
    const ok = isHttpSuccess && isBanggoodSuccess;

    // Prepare response object
    const response = {
      ok,
      httpStatus: result.httpStatus,
      banggoodCode: result.json?.code,
      banggoodMsg: result.json?.msg,
      resultPreview: result.json?.result,
      rawText: result.rawText,
      timestamp: new Date().toISOString(),
    };

    // Log debug information (without secrets)
    console.log('[Debug] Banggood access token debug result:', {
      ok,
      httpStatus: result.httpStatus,
      banggoodCode: result.json?.code,
      banggoodMsg: result.json?.msg,
      hasResult: !!result.json?.result,
    });

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('[Debug] Banggood access token debug error:', errorMessage);

    // Return error response
    const errorResponse = {
      ok: false,
      httpStatus: 0,
      banggoodCode: undefined,
      banggoodMsg: undefined,
      resultPreview: undefined,
      rawText: errorMessage,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST handler (optional) for testing with custom parameters
 * Currently not implemented but kept for future extensibility
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'POST method not supported for this debug endpoint',
      message: 'Use GET method to test Banggood access token',
    },
    { status: 405 }
  );
}
