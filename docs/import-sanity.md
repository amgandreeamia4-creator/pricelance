# CSV Import Runtime Sanity Check

This guide helps you verify that the unified CSV import feature works correctly for both providers.

## Quick Test Setup

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Open the Import Page
Navigate to: `http://localhost:3000/admin/import-csv`

### 3. Test Each Provider

#### 2Performant Provider Test
1. **Select Provider**: Choose "2performant" from the dropdown
2. **Upload File**: Use `fixtures/csv/twoperformant-sample.csv`
3. **Expected Result**: Should see:
   - `createdProducts: 1`
   - `createdListings: 1` 
   - `updatedProducts: 0`
   - `updatedListings: 0`
   - `errors: []`

#### Profitshare Provider Test  
1. **Select Provider**: Choose "profitshare" from the dropdown (default)
2. **Upload File**: Use `fixtures/csv/profitshare-sample.csv`
3. **Expected Result**: Should see:
   - `createdProducts: 1`
   - `createdListings: 1`
   - `updatedProducts: 0` 
   - `updatedListings: 0`
   - `errors: []`

### 4. Verify Database Entries (Optional)

#### Using Prisma Studio
```bash
npx prisma studio
```

Look for:
- **Product**: "Dell XPS 13" with brand "Dell" and category "Laptops"
- **Listing**: Store "eMAG" with price 4999.99 RON

#### Using Database Query
```sql
-- Check for the test product
SELECT * FROM Product WHERE name = 'Dell XPS 13';

-- Check for the test listing  
SELECT * FROM Listing WHERE storeName = 'eMAG' AND price = 4999.99;
```

## What to Look For

### ✅ Success Indicators
- HTTP 200 response
- Non-zero `createdProducts` and `createdListings` counts
- Empty `errors` array
- Products and listings appear in database

### ❌ Failure Indicators
- HTTP 4xx/5xx response
- All counts are 0
- Non-empty `errors` array
- Console errors in browser dev tools

## Sample CSV Contents

### 2Performant Sample (`twoperformant-sample.csv`)
```csv
Advertiser name,Category,Manufacturer,Product code,Product name,Product description,Product affiliate link,Product link,Product picture,Price without VAT,Price with VAT,Price with discount,Currency
eMAG,Laptops,Dell,DELL-001,Dell XPS 13,High-performance ultrabook,https://2performant.link/dell-xps13,https://emag.ro/dell-xps13,https://emag.ro/images/dell-xps13.jpg,4500.50,5400.60,4999.99,RON
```

### Profitshare Sample (`profitshare-sample.csv`)
```csv
product_name,product_url,affiliate_url,image_url,price,currency,category_raw,sku,gtin,availability,store_name
Dell XPS 13,https://emag.ro/dell-xps13,https://2performant.link/dell-xps13,https://emag.ro/images/dell-xps13.jpg,4999.99,RON,Laptops,DELL-001,0123456789012,in stock,eMAG
```

## Troubleshooting

### Common Issues
- **"Missing required columns"**: Check CSV headers match exactly
- **"No data imported"**: Verify provider selection matches CSV format
- **Database errors**: Ensure database connection is working

### Debug Steps
1. Check browser console for JavaScript errors
2. Check server terminal for import logs
3. Verify CSV file encoding (should be UTF-8)
4. Test with single row first, then multiple rows

## Architecture Notes

Both providers now use the unified `importNormalizedListings()` service:
- **2Performant**: CSV → TwoPerformantRow → NormalizedListing → importNormalizedListings
- **Profitshare**: CSV → ProfitshareRow → NormalizedListing → importNormalizedListings

This ensures consistent behavior, error handling, and database operations across both providers.
