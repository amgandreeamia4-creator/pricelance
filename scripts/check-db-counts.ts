import "dotenv/config";
import { prisma } from "../src/lib/db";

async function checkCounts() {
  try {
    const productCount = await prisma.product.count();
    console.log('Total products in database:', productCount);
    
    const listingCount = await prisma.listing.count();
    console.log('Total listings in database:', listingCount);
    
    const productsWithListings = await prisma.product.count({
      where: {
        listings: {
          some: {}
        }
      }
    });
    console.log('Products with at least one listing:', productsWithListings);
    
    // Recent products (from our test)
    const recentProducts = await prisma.product.findMany({
      where: {
        name: {
          contains: 'Test Product'
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });
    
    if (recentProducts.length > 0) {
      console.log('Recent test products found:', recentProducts.length);
      recentProducts.forEach(p => {
        console.log(`  - ${p.name} (created: ${p.createdAt})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCounts();
