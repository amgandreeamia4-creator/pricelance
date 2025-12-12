// src/app/api/products/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "Public /api/products is alive",
      products: [],
    },
    { status: 200 }
  );
}