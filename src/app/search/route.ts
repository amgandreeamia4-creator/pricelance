// src/app/api/search/route.ts
// This legacy route now just redirects to /api/products/search.

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(
    "This route has been moved to /api/products/search",
    {
      status: 308,
      headers: { Location: "/api/products/search" },
    }
  );
}