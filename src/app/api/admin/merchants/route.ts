// src/app/api/admin/merchants/route.ts
import { NextResponse } from "next/server";
// import { prisma } from "@/lib/db"; // We'll wire this later when Merchant model is ready

// Temporary stub: keeps build green while Merchant DB model is still WIP
export async function GET() {
  return NextResponse.json({
    ok: true,
    merchants: [],
    message:
        "Merchant admin API is not yet wired to the database in this deployment.",
  });
}