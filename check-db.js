// Check database connection and data
import { PrismaClient } from '@prisma/client';

const checkDB = async () => {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check products count
    const productCount = await prisma.product.count();
    console.log(`📦 Products in database: ${productCount}`);
    
    // Check listings count
    const listingCount = await prisma.listing.count();
    console.log(`🔗 Listings in database: ${listingCount}`);
    
    if (productCount > 0) {
      // Get sample products
      const sampleProducts = await prisma.product.findMany({
        take: 3,
        include: {
          listings: true
        }
      });
      
      console.log('\n📋 Sample products:');
      sampleProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (${product.listings.length} listings)`);
        product.listings.forEach(listing => {
          console.log(`   - ${listing.storeName}: $${listing.price}`);
        });
      });
    } else {
      console.log('\n❌ No products found in database');
      console.log('💡 You may need to seed the database with sample data');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
};

checkDB();
