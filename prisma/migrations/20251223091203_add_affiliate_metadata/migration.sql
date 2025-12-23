-- CreateEnum
CREATE TYPE "ListingSource" AS ENUM ('manual', 'sheet', 'seed', 'affiliate');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "affiliateProgram" TEXT,
ADD COLUMN     "affiliateProvider" TEXT,
ADD COLUMN     "merchantOriginalId" TEXT,
ADD COLUMN     "source" "ListingSource" NOT NULL DEFAULT 'seed';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "gtin" TEXT;
