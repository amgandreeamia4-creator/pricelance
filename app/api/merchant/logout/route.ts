// app/api/merchant/logout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clearMerchantSession } from '@/lib/merchantAuth';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    message: 'Logged out successfully'
  });

  clearMerchantSession(response);

  return response;
}
