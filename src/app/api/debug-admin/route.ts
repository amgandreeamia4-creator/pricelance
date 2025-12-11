// src/app/api/debug-admin/route.ts

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    nodeEnv: process.env.NODE_ENV ?? null,
    hasAdminSecret: !!process.env.ADMIN_SECRET,
    adminSecret: process.env.ADMIN_SECRET ?? null,
  });
}
