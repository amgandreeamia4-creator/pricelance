// src/app/results/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import ProductList from "@/components/ProductList";

// Types matching the combined search API response
type ProductResponse = {
  id: string;
  name: string;
  displayName: string | null;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
  listings: {
    id: string;
    storeId: string | null;
    storeName: string | null;
    price: number | null;
    currency: string | null;
    url: string | null;
    affiliateProvider: string | null;
    source: string | null;
    fastDelivery: boolean | null;
    imageUrl: string | null;
  }[];
};

type CombinedSearchResult = {
  query: string;
  limit: number;
  db: {
    products: ProductResponse[];
    total: number;
    page: number;
    perPage: number;
  };
  ebay: {
    total: number;
    items: EbayListing[];
  };
};

type EbayListing = {
  source: "ebay";
  marketplaceId: string;
  externalId: string;
  title: string;
  price: number | null;
  currency: string | null;
  url: string | null;
  imageUrl?: string | null;
  sellerName?: string | null;
};

// Props for the page component
type ResultsPageProps = {
  searchParams: {
    q?: string;
    limit?: string;
  };
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const query = searchParams.q?.trim() || "";
  const limitParam = searchParams.limit;
  const limit = limitParam ? Number(limitParam) : 48;

  // Redirect to home if no query provided
  if (!query) {
    redirect("/");
  }

  // Fetch combined search results
  let searchResult: CombinedSearchResult | null = null;
  let error: string | null = null;

  try {
    // Call the existing combined search API endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000"}/api/search/with-ebay?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        method: "GET",
        cache: "no-store", // Ensure fresh results
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    searchResult = await response.json();
  } catch (err) {
    console.error("Results page search error:", err);
    error = err instanceof Error ? err.message : "Unknown error occurred";
  }

  // If there's an error, show a simple error page
  if (error || !searchResult) {
    return (
      <div className="min-h-screen bg-[var(--pl-bg)] text-[var(--pl-text)] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link 
              href="/" 
              className="text-blue-600 hover:underline text-sm"
            >
              ← Back to main search
            </Link>
          </div>
          
          <div className="bg-[var(--pl-card)] border border-[var(--pl-card-border)] rounded-xl p-6">
            <h1 className="text-xl font-semibold mb-4">Search Error</h1>
            <p className="text-[var(--pl-text-subtle)] mb-4">
              {error || "Failed to load search results. Please try again."}
            </p>
            <Link 
              href={`/?q=${encodeURIComponent(query)}`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { db, ebay } = searchResult;

  return (
    <div className="min-h-screen bg-[var(--pl-bg)] text-[var(--pl-text)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="text-blue-600 hover:underline text-sm mb-4 inline-block"
          >
            ← Back to main search
          </Link>
          <h1 className="text-2xl font-bold text-[var(--pl-text)]">
            Results for "{query}"
          </h1>
          <p className="text-[var(--pl-text-subtle)] text-sm mt-1">
            {db.total} products found • {ebay.total} eBay items found
          </p>
        </div>

        {/* Database Products Section */}
        {db.products.length > 0 && (
          <section className="mb-8">
            <div className="bg-[var(--pl-card)] border border-[var(--pl-card-border)] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Products</h2>
              
              {/* Convert ProductResponse to the format expected by ProductList */}
              <ProductList
                products={db.products.map((product): any => ({
                  id: product.id,
                  name: product.name,
                  displayName: product.displayName,
                  brand: product.brand,
                  imageUrl: product.imageUrl,
                  listings: product.listings.map((listing): any => ({
                    price: listing.price,
                    currency: listing.currency,
                    storeName: listing.storeName || "Unknown Store",
                    url: listing.url,
                    affiliateProvider: listing.affiliateProvider,
                    source: listing.source,
                    fastDelivery: listing.fastDelivery,
                    imageUrl: listing.imageUrl,
                  })),
                }))}
                selectedProductId={null}
                onSelectProduct={() => {}} // No selection on results page
                favoriteIds={[]}
                onToggleFavorite={() => {}} // No favorites on results page
                isLoading={false}
              />
            </div>
          </section>
        )}

        {/* eBay Results Section */}
        {(ebay.items.length > 0 || error) && (
          <section>
            <div className="bg-[var(--pl-card)] border border-[var(--pl-card-border)] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">eBay Results</h2>

              {ebay.items.length === 0 && (
                <p className="text-sm text-[var(--pl-text-subtle)]">
                  No eBay results found for this search.
                </p>
              )}

              <div className="space-y-3">
                {ebay.items.map((item) => (
                  <div
                    key={item.externalId}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-gray-500">
                          Store: <span className="font-semibold">eBay</span>
                          {item.sellerName ? ` · Seller: ${item.sellerName}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {item.price != null && (
                        <div className="text-sm font-semibold">
                          {item.price} {item.currency}
                        </div>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View on eBay
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* No Results */}
        {db.products.length === 0 && ebay.items.length === 0 && (
          <div className="bg-[var(--pl-card)] border border-[var(--pl-card-border)] rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">No Results Found</h2>
            <p className="text-[var(--pl-text-subtle)] mb-4">
              No products or eBay items found for "{query}".
            </p>
            <Link 
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try a Different Search
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            href={`/?q=${encodeURIComponent(query)}`}
            className="text-blue-600 hover:underline text-sm"
          >
            Back to main search with this query
          </Link>
        </div>
      </div>
    </div>
  );
}
