# PriceLance Maintenance Guide

This guide describes ongoing operational checks for the PriceLance app. It is meant for operators and maintainers, not for feature development.

Use it as a lightweight routine to keep the catalog, database, and analytics healthy over time.

---

## Weekly: Quick health check

These checks should take only a few minutes.

- **1. Smoke test the main app**
  - [ ] Open the live site root (`/`).
  - [ ] Run a couple of searches in each core category (for example):
    - Laptops (e.g. `"laptop"`)
    - Smartphones (e.g. `"iphone"` or `"samsung"`)
    - Audio / Headphones (e.g. `"headphones"`)
    - Monitors / Peripherals (e.g. `"monitor"`, `"keyboard"`)
  - [ ] Confirm:
    - Results appear quickly and look realistic.
    - Store names and prices make sense.
    - Links open the correct store product pages.

- **2. Check `/admin/system-check`**
  - [ ] Visit `/admin/system-check?adminKey=YOUR_ADMIN_SECRET`.
  - [ ] Confirm:
    - **Database** card shows `Connected` and non-zero counts.
    - **Catalog** card shows non-zero product and listing counts.
    - **Search (last 7 days)** card shows that searches are still being logged.
  - [ ] If any section shows an error message (e.g. failed to load DB health), create a ticket or investigate immediately.

- **3. Review search coverage**
  - [ ] Visit `/admin/search-analytics?adminKey=YOUR_ADMIN_SECRET`.
  - [ ] Look at:
    - New **zero-result queries** that appear more than once.
    - Top queries with suspiciously low average result counts.
  - [ ] Note recurring zero-result queries for potential catalog expansion.

---

## Monthly: Maintenance & tuning

Once a month, take a slightly deeper look.

- **1. Catalog coverage review**
  - [ ] Use `/admin/search-analytics` to identify:
    - Zero-result queries that have appeared multiple times over the last few weeks.
    - Popular queries with only a handful of results.
  - [ ] Decide which of these should receive new products or better coverage in the curated catalog.
  - [ ] Use your existing ingestion or seeding workflows (e.g. internal providers or scripts) to add missing products.

- **2. Data refresh & scripts**
  - [ ] Review any internal/demo/ingest endpoints and scripts you rely on, for example:
    - `/api/internal/ingest` (when enabled for a given environment).
    - `/api/internal/demo-provider`, `/api/internal/dummyjson-provider`, `/api/internal/static-provider` in non-production environments.
  - [ ] Re-run any data refresh or seed routines as needed (see `prisma/seed.ts` and project scripts).

- **3. Log and table growth**
  - [ ] Check how large the `SearchLog` table is becoming (via your DB console or queries).
  - [ ] If it is growing rapidly, create a follow-up task to:
    - Introduce soft retention (e.g. keep last N days) or
    - Archive old logs into a separate table or storage.

---

## Quarterly: Deep clean & future planning

Every quarter, spend a bit more time reviewing configuration, data, and roadmap items.

- **1. Secrets and environment variables**
  - [ ] Review all critical env vars:
    - `DATABASE_URL`
    - `NEXT_PUBLIC_BASE_URL`
    - `ADMIN_SECRET`
    - `INTERNAL_API_KEY`
    - Supabase-related vars such as `SUPABASE_URL` / `SUPABASE_ANON_KEY` (if configured)
  - [ ] Confirm they still point to the intended Supabase project and domains.
  - [ ] Consider rotating `INTERNAL_API_KEY` and, if appropriate, `ADMIN_SECRET`, following your secret-management policies.

- **2. Structural health checks**
  - [ ] Hit internal health endpoints (with the correct `x-internal-key`):
    - `/api/internal/db-health`
    - `/api/internal/catalog-stats`
    - `/api/internal/search-analytics?days=30` (or a similar range)
  - [ ] Confirm:
    - Table counts and category stats look reasonable.
    - There are no unexpected errors from Prisma or the database.

- **3. Assistant quality review**
  - [ ] Manually test the assistant with fresh queries using current catalog data:
    - `"Cheapest option here?"`
    - `"Which is the best value for money?"`
    - `"Show me laptops under 3000 RON"`
  - [ ] Check if new categories, products, or stores that were added in the last quarter are well-reflected in assistant answers.
  - [ ] Capture any recurring gaps (e.g. certain stores or brands not preferred correctly) as tickets for ranking/tuning work.

- **4. Security & architecture notes (for future work)**
  - [ ] Today, all database access goes through server-side Prisma using `DATABASE_URL`, which is safe as long as internal APIs remain protected.
  - [ ] If you later introduce `supabase-js` on the client or expose public Supabase APIs, plan to:
    - Define proper **Row-Level Security (RLS)** policies in Supabase.
    - Limit what data is accessible directly from the client.
  - [ ] Keep a running list of potential improvements (e.g. better log retention, more granular admin tools, or richer analytics) to revisit in future roadmap planning.

---

Keeping up with these weekly, monthly, and quarterly routines will help ensure PriceLance remains healthy, trustworthy, and ready for new features without unexpected operational surprises.
