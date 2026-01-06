import { prisma } from '../src/lib/db';

async function main() {
  try {
    console.log('--- PriceLance Product Statistics ---\n');

    // Count all products
    const totalProducts = await prisma.product.count();
    console.log(`Total products: ${totalProducts}`);

    // Count products with 0 listings
    const productsWithZeroListings = await prisma.product.count({
      where: {
        listings: {
          none: {}
        }
      }
    });
    console.log(`Products with 0 listings: ${productsWithZeroListings}`);

    // Count products with exactly 1 listing using a different approach
    const productsWithOneListing = await prisma.product.count({
      where: {
        listings: {
          some: {}
        }
      }
    });

    // Get listing counts per product to determine exact counts
    const listingCounts = await prisma.listing.groupBy({
      by: ['productId'],
      _count: {
        id: true
      }
    });

    // Calculate distribution
    const productsWithOneListingExact = listingCounts.filter(item => item._count.id === 1).length;
    const productsWithAtLeastTwoListings = listingCounts.filter(item => item._count.id >= 2).length;

    console.log(`Products with 1 listing: ${productsWithOneListingExact}`);
    console.log(`Products with 2+ listings (real comparison): ${productsWithAtLeastTwoListings}`);

    // Verification: sum should equal total
    const verification = productsWithZeroListings + productsWithOneListingExact + productsWithAtLeastTwoListings;
    console.log(`\nVerification (sum): ${verification}`);
    console.log(`Matches total: ${verification === totalProducts ? '✅' : '❌'}`);

    // Additional stats
    const totalListings = await prisma.listing.count();
    console.log(`\nTotal listings: ${totalListings}`);
    console.log(`Average listings per product: ${(totalListings / totalProducts).toFixed(2)}`);

    // Detailed breakdown
    console.log('\n--- Detailed Listing Distribution ---');
    const distribution = listingCounts.reduce((acc, item) => {
      const count = item._count.id;
      acc[count] = (acc[count] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    Object.entries(distribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([listings, products]) => {
        console.log(`${listings} listings: ${products} products`);
      });

  } catch (error) {
    console.error('Error fetching product statistics:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
