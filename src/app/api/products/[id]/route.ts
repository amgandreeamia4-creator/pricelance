import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { ok: false, message: 'Product details API not implemented yet' },
    { status: 501 }
  );
}
