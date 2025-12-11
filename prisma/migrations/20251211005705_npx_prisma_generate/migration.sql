-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "countryCode" TEXT;

-- CreateTable
CREATE TABLE "CuratedProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "defaultPrice" DOUBLE PRECISION,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuratedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuratedListing" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "shippingCost" DOUBLE PRECISION,
    "countryCode" TEXT,

    CONSTRAINT "CuratedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CuratedListing" ADD CONSTRAINT "CuratedListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CuratedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
