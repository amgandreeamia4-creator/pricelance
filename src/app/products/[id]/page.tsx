import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

type ProductWithListings = {
  id: string;
  name: string;
  displayName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  listings: {
    id: string;
    storeName: string;
    storeLogoUrl?: string | null;
    price: number;
    priceCents?: number | null;
    currency: string;
    url?: string | null;
    shippingCost?: number | null;
    deliveryTimeDays?: number | null;
    deliveryDays?: number | null;
    estimatedDeliveryDays?: number | null;
    fastDelivery?: boolean | null;
    isFastDelivery?: boolean | null;
    inStock?: boolean | null;
    affiliateProvider?: string | null;
    source?: string | null;
  }[];
};

async function getProduct(id: string): Promise<ProductWithListings | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        Listing: {
          select: {
            id: true,
            storeName: true,
            storeLogoUrl: true,
            price: true,
            priceCents: true,
            currency: true,
            url: true,
            shippingCost: true,
            deliveryTimeDays: true,
            deliveryDays: true,
            estimatedDeliveryDays: true,
            fastDelivery: true,
            isFastDelivery: true,
            inStock: true,
            affiliateProvider: true,
            source: true,
          },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      ...product,
      listings: product.Listing,
    } as ProductWithListings;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

type ShapedListing = {
  id: string;
  storeName: string;
  storeLogoUrl?: string | null;
  priceDisplay: string;
  shippingInfo: string;
  isBestPrice: boolean;
  isFastestDelivery: boolean;
  url?: string | null;
  isAffiliate: boolean;
};

function formatPrice(price: number, currency: string): string {
  return `${price.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function getShippingInfo(listing: ProductWithListings['listings'][0]): string {
  if (listing.shippingCost === 0 || listing.shippingCost === null) {
    if (listing.deliveryDays || listing.deliveryTimeDays || listing.estimatedDeliveryDays) {
      const days = listing.deliveryDays || listing.deliveryTimeDays || listing.estimatedDeliveryDays;
      return `Free delivery / ${days} days`;
    }
    return "Free delivery";
  }
  
  if (listing.shippingCost && listing.shippingCost > 0) {
    const days = listing.deliveryDays || listing.deliveryTimeDays || listing.estimatedDeliveryDays;
    if (days) {
      return `Delivery from ${listing.shippingCost.toFixed(2)} ${listing.currency} / ${days} days`;
    }
    return `Delivery from ${listing.shippingCost.toFixed(2)} ${listing.currency}`;
  }
  
  return "Delivery info not available";
}

function shapeListings(listings: ProductWithListings['listings']): ShapedListing[] {
  if (listings.length === 0) return [];
  
  const minPrice = Math.min(...listings.map(l => l.price));
  const fastestDelivery = Math.min(...listings
    .filter(l => l.deliveryDays || l.deliveryTimeDays || l.estimatedDeliveryDays)
    .map(l => l.deliveryDays || l.deliveryTimeDays || l.estimatedDeliveryDays || Infinity));
  
  return listings.map((listing, index) => ({
    id: listing.id,
    storeName: listing.storeName,
    storeLogoUrl: listing.storeLogoUrl,
    priceDisplay: formatPrice(listing.price, listing.currency),
    shippingInfo: getShippingInfo(listing),
    isBestPrice: listing.price === minPrice,
    isFastestDelivery: fastestDelivery !== Infinity && (
      listing.deliveryDays === fastestDelivery || 
      listing.deliveryTimeDays === fastestDelivery || 
      listing.estimatedDeliveryDays === fastestDelivery
    ),
    url: listing.url,
    isAffiliate: Boolean(listing.affiliateProvider || listing.source),
  }));
}

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const shapedListings = shapeListings(product.listings);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back link - full width */}
      <div className="mb-6">
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
        >
          ← Back to search results
        </Link>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
        {/* Left column - Product Hero */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {product.displayName || product.name}
          </h1>
          {product.brand && (
            <p className="text-sm text-slate-500 mb-4">
              Brand: <span className="font-medium text-slate-900">
                {product.brand || "Unknown brand"}
              </span>
            </p>
          )}
          
          {product.imageUrl && (
            <div className="mb-6">
              <img
                src={product.imageUrl}
                alt={product.displayName || product.name}
                className="w-full max-w-md h-auto rounded-lg shadow-md"
              />
            </div>
          )}
        </div>

        {/* Right column - Offers Section */}
        <div>
          {shapedListings.length === 0 ? (
            <div className="rounded-2xl bg-white/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">No offers available</h2>
              <p className="text-gray-600">We don't have store offers for this product yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/90 p-6 shadow-sm">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">
                  Offers for this product
                </h2>
                <p className="text-gray-600 mb-1">
                  We found {shapedListings.length} offers from different stores.
                </p>
                <p className="text-sm text-gray-500">
                  Sorted by total price
                </p>
              </div>

              {/* Mini Cards List */}
              <div className={`space-y-3 mb-8 ${shapedListings.length > 10 ? 'max-h-[70vh] overflow-y-auto pr-2' : ''}`}>
                {shapedListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="relative flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden"
                  >
                    {/* BEST PRICE badge */}
                    {listing.isBestPrice && (
                      <div className="absolute top-3 left-3 rounded-full bg-sky-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                        Best price
                      </div>
                    )}

                    {/* FASTEST DELIVERY badge */}
                    {listing.isFastestDelivery && (
                      <div className="absolute top-3 right-3 rounded-full bg-green-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                        Fastest delivery
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      {/* Store info */}
                      <div className="flex items-center space-x-3">
                        {listing.storeLogoUrl ? (
                          <img
                            src={listing.storeLogoUrl}
                            alt={listing.storeName}
                            className="w-10 h-10 object-contain rounded-lg border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border bg-gray-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 text-center leading-tight">
                              {listing.storeName.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{listing.storeName}</h3>
                          {listing.isAffiliate && (
                            <p className="text-xs text-gray-500">Affiliate</p>
                          )}
                        </div>
                      </div>

                      {/* Price and shipping */}
                      <div className="flex-1 text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {listing.priceDisplay}
                        </div>
                        <p className="text-sm text-gray-600">
                          {listing.shippingInfo}
                        </p>
                      </div>

                      {/* CTA Button */}
                      <div>
                        {listing.url ? (
                          <a
                            href={listing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-medium text-sm"
                          >
                            Go to store
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm px-6 py-2">Link unavailable</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guidance Text */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">How to choose a store</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Look at total cost (price + delivery), delivery time, and how much you trust the retailer. 
                  Pick the option that feels fair and reliable for you.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
