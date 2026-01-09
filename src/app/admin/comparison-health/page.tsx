// src/app/admin/comparison-health/page.tsx
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  // High-level counts
  const [productCount, listingCount] = await Promise.all([
    prisma.product.count(),
    prisma.listing.count(),
  ]);

  // Per-product listing counts
  const productsWithCounts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      brand: true,
      _count: {
        // IMPORTANT: Prisma's _count type on Product expects `Listing` here
        select: {
          Listing: true,
        },
      },
    },
  });

  let with0 = 0;
  let with1 = 0;
  let with2plus = 0;

  for (const p of productsWithCounts) {
    const c = p._count?.Listing ?? 0;

    if (c === 0) with0++;
    else if (c === 1) with1++;
    else if (c >= 2) with2plus++;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">DB Comparison Health</h1>
        <p className="text-sm text-slate-500">
          Quick audit of how many listings each product has, to spot catalog
          gaps and single-offer products.
        </p>
      </header>

      {/* Top summary cards */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs text-slate-500">Total products</div>
          <div className="text-xl font-bold">{productCount}</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs text-slate-500">Total listings</div>
          <div className="text-xl font-bold">{listingCount}</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs text-slate-500">Products with 0 offers</div>
          <div className="text-xl font-bold">{with0}</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs text-slate-500">Products with 2+ offers</div>
          <div className="text-xl font-bold">{with2plus}</div>
        </div>
      </section>

      {/* Breakdown table */}
      <section aria-label="Products offer distribution">
        <h2 className="mb-2 text-lg font-semibold">Offer distribution</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-3 py-2">Bucket</th>
              <th className="px-3 py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2">0 offers</td>
              <td className="px-3 py-2">{with0}</td>
            </tr>
            <tr>
              <td className="px-3 py-2">1 offer</td>
              <td className="px-3 py-2">{with1}</td>
            </tr>
            <tr>
              <td className="px-3 py-2">2+ offers</td>
              <td className="px-3 py-2">{with2plus}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}