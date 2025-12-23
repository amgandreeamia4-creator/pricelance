# PriceLance Deployment Checklist

This checklist is tailored to the PriceLance Next.js 16 (App Router) app backed by Prisma + Supabase Postgres. Use it before and after each production deployment.

---

## 1. Required environment variables

Set these in your production environment (e.g. Vercel project settings):

- **DATABASE_URL**  
  PostgreSQL connection string pointing to your Supabase database.  
  Must **not** be a `file:./dev.db` URL. This is what Prisma uses for all DB access.

- **NEXT_PUBLIC_BASE_URL**  
  The full base URL of the deployed app, e.g. `https://your-app.vercel.app` or `https://app.pricelance.com`.  
  Used by admin pages (like `/admin/search-analytics` and `/admin/system-check`) to call internal APIs from the server.

- **ADMIN_SECRET**  
  Secret string required for admin pages in production, via the `adminKey` query param:  
  `https://your-app.com/admin/search-analytics?adminKey=ADMIN_SECRET`  
  `https://your-app.com/admin/system-check?adminKey=ADMIN_SECRET`.

- **INTERNAL_API_KEY**  
  Secret key required for internal and debug APIs that use `checkInternalAuth`, including:
  - `/api/internal/search-analytics`
  - `/api/internal/catalog-stats`
  - `/api/internal/db-health`
  - `/api/internal/ingest`
  - `/api/internal/cleanup-demo`
  - `/api/internal/demo-provider`, `/api/internal/dummyjson-provider`, `/api/internal/static-provider`
  - `/api/internal/stats`, `/api/internal/run-providers`, `/api/internal/realstore-test`
  - `/api/debug-admin`

Recommended additional variables (even if not used directly yet):

- **SUPABASE_URL**, **SUPABASE_ANON_KEY**  
  Standard Supabase project URL and anon key.  
  The app currently talks to Supabase **only** via Prisma + `DATABASE_URL`, but these are useful to keep in sync for future direct `supabase-js` usage.

---

## 2. Notes for Vercel / production environments

- **Do not use SQLite in production.**  
  A `DATABASE_URL` like `file:./prisma/dev.db` will not work on Vercel because the file system is read-only.  
  Use Supabase Postgres (or another cloud Postgres) and point `DATABASE_URL` to that.

- **`NODE_ENV=production` is automatic on Vercel.**  
  In production, admin pages and internal APIs behave more strictly:
  - `/admin/*` pages require a valid `ADMIN_SECRET` + `adminKey` query parameter.
  - Internal APIs require `INTERNAL_API_KEY` via the `x-internal-key` header.

---

## 3. Pre-deploy checklist (run locally)

- **Code quality and build:**
  - [ ] Run `npm run lint` and ensure there are no lint errors.
  - [ ] Run `npm run build` and ensure the build passes.

- **Database schema & seed:**
  - [ ] Apply all Prisma migrations to the Supabase database  
        (e.g. using `npx prisma migrate deploy` or your project’s migration workflow).
  - [ ] Run any seed script if you still rely on seeded data (see `prisma/seed.ts` and your `package.json` scripts).

- **Core tables present and populated:**
  - [ ] Confirm `Product` and `Listing` contain at least some real data.
  - [ ] Confirm `ProductPriceHistory` has entries for at least a few products.
  - [ ] Confirm `SearchLog` exists (it will populate automatically after searches in the live app).

- **Environment configuration sanity:**
  - [ ] `DATABASE_URL` points to the correct Supabase Postgres instance.
  - [ ] `NEXT_PUBLIC_BASE_URL` matches the URL where the app will be served.
  - [ ] `ADMIN_SECRET` is set and known to the ops/admin team.
  - [ ] `INTERNAL_API_KEY` is set and stored safely (used by scripts or tooling that call internal APIs).

---

## 4. Post-deploy sanity checks

After deploying, run through this flow against the live site.

### 4.1 Main app behavior

- [ ] Open the main page (root `/`).
- [ ] Run a few searches in core categories, for example:
  - `"laptop"`
  - `"iphone"`
  - `"headphones"`
  - `"monitor"`
- [ ] Verify:
  - Results look real and come from expected stores (e.g. eMAG, Altex, Amazon, etc.).
  - Product links go to the expected store product pages.

### 4.2 Price history

- [ ] Pick a product that should have price history (seeded or imported data).
- [ ] Open its details panel and confirm the **PriceTrendChart** shows a line or multiple points.
- [ ] Pick a product that is unlikely to have history and confirm the chart shows a reasonable "no history" empty state.

### 4.3 Assistant behavior

In the right-hand assistant panel:

- [ ] Ask: `"Cheapest option here?"`  
      Confirm the answer aligns with the visibly cheapest product in the current results.
- [ ] Ask: `"Which is best value?"`  
      Confirm the answer references real products and mentions store/price information.
- [ ] Ask: `"Show me options under 3000 RON"` (or another numeric budget).  
      Confirm the assistant filters down to items that make sense given the price levels.

### 4.4 Analytics & admin surfaces

- [ ] Visit `/admin/search-analytics?adminKey=YOUR_ADMIN_SECRET`:
  - Confirm the page loads (no access-denied errors with the correct key).
  - Check that total searches and top queries look plausible.

- [ ] Visit `/admin/system-check?adminKey=YOUR_ADMIN_SECRET`:
  - Confirm the **Database** card shows `Connected` and non-zero counts.
  - Confirm the **Catalog** card shows non-zero product counts.
  - Confirm the **Search (last 7 days)** card shows non-zero counters after you’ve used the app.
  - Inspect the top zero-result queries.

- [ ] (Optional) Hit internal health endpoints via a tool like `curl` or Postman, including the `x-internal-key` header:
  - `/api/internal/db-health`
  - `/api/internal/catalog-stats`
  - `/api/internal/search-analytics?days=7`

If all of the above pass, the deployment is in a good state for real usage.
