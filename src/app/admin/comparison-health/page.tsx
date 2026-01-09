// src/app/admin/comparison-health/page.tsx
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [productCount, listingCount] = await Promise.all([
    prisma.product.count(),
    prisma.listing.count(),
  ]);

  const productsWithCounts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      brand: true,
      // use the Listing relation directly, then count in JS
      Listing: {
        select: { id: true },
      },
    },
  });

  let with0 = 0;
  let with1 = 0;
  let with2plus = 0;

  for (const p of productsWithCounts) {
    const c = p.Listing.length;

    if (c === 0) with0++;
    else if (c === 1) with1++;
    else if (c >= 2) with2plus++;
  }

  const sorted = [...productsWithCounts].sort(
    (a, b) => b.Listing.length - a.Listing.length
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col space-y-6 p-4">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">DB Comparison Health</h1>
        <p className="text-sm text-slate-500">
          Overview of how many offers each product has in the database.
        </p>

        <div className="grid gap-4 md:grid-cols-4">
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
        </div>
      </header>

      <section
        aria-label="Products by listing count"
        className="space-y-4"
      >
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Offers</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {p.displayName ?? p.name ?? "(no name)"}
                    </div>
                    <div className="text-xs text-slate-500">{p.id}</div>
                  </td>
                  <td className="px-3 py-2">{p.brand ?? "-"}</td>
                  <td className="px-3 py-2">{p.Listing.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="inline-block rounded-xl bg-slate-50 p-4 text-sm">
          <div className="mb-2 font-semibold">Summary</div>
          <table>
            <tbody>
              <tr>
                <td className="px-3 py-1">0 offers</td>
                <td className="px-3 py-1">{with0}</td>
              </tr>
              <tr>
                <td className="px-3 py-1">1 offer</td>
                <td className="px-3 py-1">{with1}</td>
              </tr>
              <tr>
                <td className="px-3 py-1">2+ offers</td>
                <td className="px-3 py-1">{with2plus}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}