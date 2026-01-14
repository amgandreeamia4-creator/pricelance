import { notFound } from "next/navigation";
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
    currency: string;
    url?: string | null;
    fastDelivery?: boolean | null;
    deliveryDays?: number | null;
    inStock?: boolean | null;
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
            currency: true,
            url: true,
            fastDelivery: true,
            deliveryDays: true,
            inStock: true,
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Product Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {product.displayName || product.name}
        </h1>
        {product.brand && (
          <p className="text-lg text-gray-600 mb-4">Brand: {product.brand}</p>
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

      {/* Offers Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Available Offers ({product.listings.length})
        </h2>
        
        {product.listings.length === 0 ? (
          <p className="text-gray-500">No offers available for this product.</p>
        ) : (
          <div className="space-y-4">
            {product.listings.map((listing) => (
              <div
                key={listing.id}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {listing.storeLogoUrl && (
                      <img
                        src={listing.storeLogoUrl}
                        alt={listing.storeName}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{listing.storeName}</h3>
                      <p className="text-sm text-gray-600">
                        {listing.currency} {listing.price.toFixed(2)}
                      </p>
                      {listing.fastDelivery && (
                        <p className="text-xs text-green-600">Fast delivery available</p>
                      )}
                      {listing.deliveryDays && (
                        <p className="text-xs text-gray-500">
                          Est. delivery: {listing.deliveryDays} days
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {listing.url ? (
                      <a
                        href={listing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        View Offer
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">Link unavailable</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
