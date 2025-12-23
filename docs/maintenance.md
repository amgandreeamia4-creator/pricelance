# PriceLance Maintenance Runbook

This document describes the suggested maintenance routine for PriceLance to ensure data quality, system health, and compliance.

## Admin Tools

| Tool | URL | Purpose |
|------|-----|---------|
| System Check | `/admin/system-check` | Overview of database, catalog, search stats, and affiliate metrics |
| CSV Import | `/admin/import-csv` | Bulk import products/listings from local CSV files |
| Feed Import | `/admin/import-feeds` | Import from predefined Google Sheet URLs |
| Manual Products | `/admin/manual-products` | Create individual products and listings |

## Weekly Routine

### 1. Spot-check Listings (5-10 min)

- [ ] Go to `/` and search for a few popular products
- [ ] Click on 3-5 listing links to verify they open real store pages (not 404)
- [ ] Verify prices shown are reasonable (no obvious data errors like `0.01` or `9999999`)
- [ ] Check that "Fast delivery" badges appear where expected

### 2. Review System Check (2-3 min)

- [ ] Go to `/admin/system-check`
- [ ] Verify database is connected
- [ ] Check product/listing counts are stable or growing
- [ ] Review "Listings by Source" table for expected distribution
- [ ] Note any unusual spikes in zero-result queries

### 3. Quick Import Check (if applicable)

- [ ] If using scheduled imports, verify they ran successfully
- [ ] Check import logs for errors

## Monthly Routine

### 1. Category Coverage Review (15-20 min)

- [ ] Review product counts per category
- [ ] Identify categories with low coverage
- [ ] Prioritize adding products/listings in underserved categories

### 2. Dead Product Cleanup (10-15 min)

- [ ] Identify products with no valid listings for 30+ days
- [ ] Decide whether to:
  - Keep them (waiting for affiliate feed)
  - Archive/delete them (truly dead products)

### 3. Data Quality Audit

- [ ] Check for duplicate products (same GTIN, different entries)
- [ ] Review listings with unusual prices (too high or too low)
- [ ] Verify store names are normalized correctly

## Quarterly Routine

### 1. Affiliate Provider Review (30 min)

- [ ] Review affiliate provider breakdown in `/admin/system-check`
- [ ] Check affiliate feed health for each provider
- [ ] Verify affiliate links are still working (not expired)
- [ ] Update affiliate credentials if needed

### 2. Legal & Compliance Check (20 min)

- [ ] Re-read partner Terms & Conditions
- [ ] Verify affiliate disclosure is visible on site
- [ ] Check that no prohibited content is listed
- [ ] Review any compliance emails from affiliate networks

### 3. Performance & Schema Review (30 min)

- [ ] Check database query performance (slow queries)
- [ ] Review Prisma schema for optimization opportunities
- [ ] Consider adding indexes for frequently queried fields
- [ ] Run `npm run build` to check for any warnings

### 4. Security Review

- [ ] Verify `ADMIN_USER`/`ADMIN_PASSWORD` are set in production
- [ ] Check that no sensitive data is exposed in logs
- [ ] Review API rate limiting if implemented
- [ ] Check for dependency updates (`npm audit`)

## Incident Response

### Import Failures

1. Check import logs in console/server logs
2. Verify source CSV/feed is accessible
3. Check for schema changes in source data
4. Review error summary in import results

### Missing Products

1. Verify product exists in database (`/admin/system-check`)
2. Check if product has any valid listings
3. Verify listings pass "good listing" filter (valid URL + price > 0)
4. Check source filter in `/api/products`

### Performance Issues

1. Check database connection pool
2. Review recent imports for large data volumes
3. Check for missing indexes on frequently queried fields
4. Review server memory/CPU usage

## Useful Commands

```bash
# Run linting
npm run lint

# Build production
npm run build

# Start development server
npm run dev

# Generate Prisma client (after schema changes)
npx prisma generate

# Run database migration
npx prisma migrate dev --name <migration_name>

# View database in Prisma Studio
npx prisma studio
```

## Contact

For urgent issues, contact the development team or check the project repository for open issues.
