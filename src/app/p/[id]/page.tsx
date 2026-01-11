// src/app/p/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isListingFromDisabledNetwork } from "@/config/affiliateNetworks";
import type { Metadata } from "next";

type Listing = {
  id: string;
  storeName: string | null;
  storeLogoUrl: string | null;
  url: string | null;
  price: number | null;
  currency: string | null;
  fastDelivery: boolean | null;
  deliveryTimeDays: number | null;
  deliveryDays: number | null;
  affiliateProvider: string | null;
  affiliateProgram: string | null;
};

type Product = {
  id: string;
  name: string;
  displayName: string | null;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
  listings: Listing[];
};

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return {
      title: "Product not found | PriceLance",
      description: "The requested product could not be found.",
    };
  }

  const productName = product.displayName || product.name;

  return {
    title: `${productName} – Price comparison | PriceLance`,
    description: `Compare prices and offers for ${productName} from multiple online stores in Romania.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  // Fetch the product by ID
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  // Fetch listings for this product
  const dbListings = await prisma.listing.findMany({
    where: { productId: id },
  });

  // Filter listings based on disabled affiliate networks
  const visibleListings = dbListings.filter((l) =>
    !isListingFromDisabledNetwork({
      affiliateProvider: l.affiliateProvider,
      affiliateProgram: l.affiliateProgram,
      url: l.url,
    })
  );

  const productData: Product = {
    id: product.id,
    name: product.name,
    displayName: product.displayName,
    brand: product.brand,
    imageUrl: product.imageUrl,
    category: product.category,
    listings: visibleListings.map((l) => ({
      id: l.id,
      storeName: l.storeName,
      storeLogoUrl: l.storeLogoUrl,
      url: l.url,
      price: l.price,
      currency: l.currency,
      fastDelivery: l.fastDelivery,
      deliveryTimeDays: l.deliveryTimeDays,
      deliveryDays: l.deliveryDays,
      affiliateProvider: l.affiliateProvider,
      affiliateProgram: l.affiliateProgram,
    })),
  };

  const productName = productData.displayName || productData.name;
  const uniqueStores = new Set(productData.listings.map(l => l.storeName).filter(Boolean));

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {productName}
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {productData.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={productData.imageUrl}
                  alt={productName}
                  className="w-32 h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                />
              </div>
            )}
            
            <div className="flex-1">
              {productData.brand && (
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
                  Brand: {productData.brand}
                </p>
              )}
              
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Found {productData.listings.length} offer{productData.listings.length !== 1 ? 's' : ''} from {uniqueStores.size} store{uniqueStores.size !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>

        {/* Offers Section */}
        <section>
          <div className="rounded-2xl bg-[var(--pl-card)] border border-[var(--pl-card-border)] p-6">
            <h2 className="text-xl font-semibold text-[var(--pl-text)] mb-6">
              Available Offers
            </h2>

            {productData.listings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--pl-text-muted)]">
                  No offers available yet for this product.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productData.listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-[var(--pl-card-border)] rounded-lg hover:bg-[var(--pl-bg)]/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                      {listing.storeLogoUrl ? (
                        <img
                          src={listing.storeLogoUrl}
                          alt={listing.storeName || 'Store'}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center bg-[var(--pl-bg)] rounded text-xs text-[var(--pl-text-muted)]">
                          {listing.storeName?.charAt(0) || 'S'}
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium text-[var(--pl-text)]">
                          {listing.storeName || 'Unknown Store'}
                        </p>
                        {(listing.fastDelivery || listing.deliveryTimeDays || listing.deliveryDays) && (
                          <p className="text-xs text-[var(--pl-text-muted)] mt-1">
                            {listing.fastDelivery && <span className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs mr-2">Fast delivery</span>}
                            {listing.deliveryTimeDays && <span>Delivery: {listing.deliveryTimeDays} days</span>}
                            {listing.deliveryDays && <span>Delivery: {listing.deliveryDays} days</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-[var(--pl-text)]">
                          {listing.price ? `${listing.price} ${listing.currency || 'RON'}` : 'Price not available'}
                        </p>
                      </div>
                      
                      {listing.url ? (
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center px-4 py-2 bg-[var(--pl-primary)] hover:brightness-110 text-white font-medium rounded-lg transition-colors"
                        >
                          Go to store
                        </a>
                      ) : (
                        <span className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-600 font-medium rounded-lg cursor-not-allowed">
                          Link coming soon
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
