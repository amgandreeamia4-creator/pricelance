# Enhanced Error Logging for CSV Import API

## Overview
Enhanced the CSV import API to provide comprehensive error logging and detailed debug information for failed rows.

## Changes Made

### 1. **src/lib/importService.ts**

#### Updated ImportSummary Type
- Added `debugErrors` array to track detailed error context
- Each debug error includes:
  - `rowNumber`: The row index
  - `rawRow`: The original NormalizedListing input
  - `transformedData`: The data as it would be sent to Prisma (selected fields)
  - `errorMessage`: The full error message
  - `errorStack`: Full stack trace (if available)
  - `errorCode`: Error code from Prisma (if available)

#### Enhanced importNormalizedListings Function
- Initialize `debugErrors` array in summary
- Capture full error context in catch block:
  - Extract error message and stack trace
  - Extract error code
  - Log detailed information to console with context
  - Capture transformed data before DB operation
  - Limit debugErrors to first 10 entries
- Enhanced console logging to include:
  - Raw row data (title, brand, category, storeName, url, price, currency)
  - Transformed data object
  - Full error stack trace

### 2. **src/app/api/admin/import-csv/route.ts**

#### Updated processBatch Function (Profitshare Path)
- Extended return type to include `debugErrors` array
- Enhanced error handling in try/catch:
  - Capture full error message and stack trace
  - Build comprehensive transformed data object
  - Extract error code
  - Log detailed error information to console including:
    - Raw row data (name, storeName, price, affiliateUrl, category, brand, gtin)
    - Transformed data (includes affiliate metadata, merchant info)
    - Full error stack trace
  - Limit debugErrors to first 10 entries
- Updated return statement to include debugErrors

#### Updated 2Performant Path
- Added `debugErrors` array initialization
- Accumulate debugErrors from importNormalizedListings summary
- Added debugErrors to all response objects:
  - Validation error response (empty array)
  - Success response (includes debugErrors from summary)
- Limit debugErrors to first 10 entries

#### Updated Profitshare Path
- Added `debugErrors` array initialization
- Accumulate debugErrors from batch processing results
- Limit debugErrors to first 10 entries
- Added debugErrors to all response objects:
  - Empty rows response (empty array)
  - Success response (includes accumulated debugErrors)

## Error Logging Structure

### Console Output Example
For each failed row, console.error logs:
```json
{
  "rowNumber": 5,
  "rawRow": {
    "title": "Product Name",
    "brand": "Brand",
    "category": "Category",
    "storeName": "Store",
    "url": "https://...",
    "price": 99.99,
    "currency": "RON"
  },
  "transformedData": {
    "productTitle": "Product Name",
    "brand": "Brand",
    "category": "Category",
    "storeName": "Store",
    "url": "https://...",
    "price": 99.99,
    "currency": "RON",
    "storeId": "store_id",
    "inStock": true
  },
  "errorMessage": "Unique constraint failed on ...",
  "errorCode": "P2002",
  "stack": "[full error stack trace]"
}
```

### API Response Structure
The JSON response now includes:
```json
{
  "ok": true/false,
  "totalRows": 100,
  "processedRows": 95,
  "failedRows": 5,
  "errors": [
    {
      "rowNumber": 5,
      "message": "Unique constraint failed",
      "code": "P2002"
    }
  ],
  "debugErrors": [
    {
      "rowNumber": 5,
      "rawRow": { /* original input */ },
      "transformedData": { /* data before insert */ },
      "errorMessage": "Unique constraint failed",
      "errorStack": "[stack trace]",
      "errorCode": "P2002"
    }
  ],
  "..." : "other fields"
}
```

## Key Features

✅ **No Error Swallowing**: All errors are logged with full context
✅ **First 10 Errors**: debugErrors limited to first 10 for response size management
✅ **Full Stack Traces**: Captured in errorStack field for debugging
✅ **Transformed Data**: Shows exactly what data was sent to Prisma before failure
✅ **Row Index Tracking**: Each error includes row number for correlation
✅ **Error Codes**: Prisma error codes extracted (e.g., P2002 for unique constraint)
✅ **Both Paths Supported**: Enhanced logging for both 2performant and profitshare providers
✅ **Comprehensive Console Logging**: Detailed server-side logs for backend debugging

## Benefits

1. **Better Debugging**: See exactly what data caused the failure
2. **Error Correlation**: Row numbers make it easy to identify problematic rows in CSV
3. **Error Context**: Stack traces and error codes provide diagnostic information
4. **Non-Blocking**: Errors don't stop the import process; rows are skipped and logged
5. **Performance**: Limited to 10 errors prevents response bloat for large failures
6. **Transparency**: Both console and API response provide full error details

## Testing Recommendations

1. Test with invalid data to trigger constraint violations
2. Test with missing required fields
3. Test with data that causes category inference errors
4. Verify console output includes full error context
5. Verify API response includes debugErrors array
6. Confirm errors are limited to first 10 entries
