# CSV Import API - Enhanced Error Logging Usage Guide

## Quick Summary

The CSV import API now provides comprehensive error logging for failed rows with full context including:
- Row index and raw CSV data
- Transformed object before database insert
- Full error messages with stack traces
- Error codes (e.g., Prisma error codes)
- Limited to first 10 errors in API response

## Files Modified

1. **[src/lib/importService.ts](src/lib/importService.ts)**
   - Updated `ImportSummary` type with `debugErrors` array
   - Enhanced `importNormalizedListings()` error handling

2. **[src/app/api/admin/import-csv/route.ts](src/app/api/admin/import-csv/route.ts)**
   - Updated `processBatch()` to capture detailed error context
   - Enhanced both 2performant and profitshare paths
   - Added `debugErrors` to all API responses

## API Response Format

### Success Response with Errors
```typescript
{
  "ok": true,
  "totalRows": 100,
  "processedRows": 95,
  "failedRows": 5,
  "errors": [
    {
      "rowNumber": 5,
      "message": "Unique constraint failed on product",
      "code": "P2002"
    }
  ],
  "debugErrors": [
    {
      "rowNumber": 5,
      "rawRow": {
        "productTitle": "Product Name",
        "brand": "Brand",
        "category": "Category",
        "storeName": "Store",
        "url": "https://example.com",
        "price": 99.99,
        "currency": "RON"
      },
      "transformedData": {
        "productTitle": "Product Name",
        "brand": "Brand",
        "category": "Category",
        "storeName": "Store",
        "url": "https://example.com",
        "price": 99.99,
        "currency": "RON",
        "storeId": "store",
        "inStock": true
      },
      "errorMessage": "Unique constraint failed on the fields: (`name`,`brand`)",
      "errorStack": "PrismaClientKnownRequestError: Unique constraint failed...",
      "errorCode": "P2002"
    }
  ],
  "createdProducts": 90,
  "updatedProducts": 5,
  "createdListings": 85,
  "updatedListings": 10,
  "provider": "2performant"
}
```

## Console Output

When a row fails, detailed information is logged to the server console:

```
[importService] Row 5 failed {
  rawRow: {
    title: 'Product Name',
    brand: 'Brand',
    category: 'Category',
    storeName: 'Store',
    url: 'https://example.com',
    price: 99.99,
    currency: 'RON'
  },
  errorMessage: 'Unique constraint failed on the fields: (`name`,`brand`)',
  errorCode: 'P2002'
}
Error stack trace here...

[import-csv] Row failed {
  rowNumber: 5,
  message: 'Unique constraint failed...',
  errorCode: 'P2002',
  rawRow: {
    name: 'Product Name',
    storeName: 'Store',
    price: 99.99,
    affiliateUrl: 'https://example.com',
    category: 'Category'
  },
  transformedData: {
    productName: 'Product Name',
    storeName: 'Store',
    price: 99.99,
    currency: 'RON',
    affiliateUrl: 'https://example.com',
    productUrl: undefined,
    imageUrl: undefined,
    category: 'Category',
    sku: undefined,
    gtin: undefined,
    availability: undefined,
    affiliateProvider: 'profitshare',
    affiliateProgram: undefined,
    merchantId: undefined,
    merchantFeedId: undefined
  },
  stack: '[full error stack trace]'
}
```

## Testing Error Logging

### Test Case 1: Duplicate Product Name
```bash
# Import CSV with duplicate product names
curl -X POST http://localhost:3000/api/admin/import-csv \
  -H "x-admin-token: your-token" \
  -F "file=@test.csv" \
  -F "provider=2performant"
```

Expected output:
- `failedRows` > 0
- `debugErrors` contains entries with error code P2002 (unique constraint)
- `rawRow` shows the duplicate data
- `transformedData` shows exactly what was sent to database

### Test Case 2: Missing Required Fields
Rows with missing productTitle, brand, or price should:
- Be caught in validation
- Generate error messages like "Missing product_title"
- Appear in `errors` array but not necessarily `debugErrors` (validation errors)

### Test Case 3: Database Constraint Violation
Rows that violate other database constraints should:
- Include full Prisma error code (P2003, P2015, etc.)
- Include complete stack trace
- Show exactly what data triggered the violation

## Debugging Guidelines

1. **Check Row Number**: Use `rowNumber` to find the exact row in the CSV (1-indexed in response, corresponding to Excel row)

2. **Inspect Transformed Data**: Compare `rawRow` vs `transformedData` to see any transformations applied

3. **Read Error Code**: 
   - `P2002`: Unique constraint violation
   - `P2003`: Foreign key constraint violation
   - `P2005`: Invalid value for field
   - See [Prisma error reference](https://www.prisma.io/docs/reference/api-reference/error-reference)

4. **Use Stack Trace**: If error isn't a Prisma error, check the stack trace for the exact line that failed

5. **Check Console**: Server console logs provide additional context and are logged immediately when error occurs

## Performance Considerations

- `debugErrors` limited to first 10 entries to prevent response bloat
- All errors are logged to console regardless of limit
- Error logging doesn't significantly impact import performance
- Large imports with many errors will have first 10 errors in API response, all in console logs

## Error Handling Best Practices

1. Always check `ok` field to determine overall success
2. Use `debugErrors` for debugging specific failures
3. Use `errors` array for user-facing error messages (has basic message without stack trace)
4. Monitor console logs for complete error trace
5. Log API responses for failed imports for audit trail
6. Use error codes to categorize failures programmatically

## Integration with Monitoring

The enhanced error logging integrates with:
- Server console logs (via console.error)
- API JSON response with debugErrors array
- Error codes for programmatic handling
- Full stack traces for debugging

This allows you to:
- Monitor errors in real-time via console streaming
- Send error data to logging services (e.g., Sentry, DataDog)
- Set up alerts on specific error codes
- Generate audit reports from API responses
