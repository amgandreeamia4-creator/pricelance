# PriceLance – Maintenance & Deployment Guide

## Weekly – Quick Health Check
- Run the app like a normal user:
  - Search for a few popular terms (e.g. "laptop", "iphone", "headphones").
  - Click through filters and ensure results feel fast and correct.
- Check Vercel logs:
  - Look for repeated 4xx/5xx errors on `/api/products` and `/api/assistant`.
- Glance at Supabase:
  - Confirm recent rows in `SearchLog`.
  - Confirm new or updated rows in `Product` and `Listing` look sane.
- Write down any obvious bugs or slow spots.

## Monthly – Maintenance & Tuning
- Performance:
  - Check perceived load time for the homepage and first search.
  - Confirm product cards and images load without broken thumbnails.
- Database:
  - Look at row counts for `Product`, `Listing`, `SearchLog`, and (when present) `ProductPriceHistory`.
  - Look for obvious duplicates or garbage demo data and clean them.
- Security & config:
  - Verify `ADMIN_SECRET` and `INTERNAL_API_KEY` are set correctly in Vercel.
  - Confirm admin/internal routes still require Basic Auth.
- Tech debt:
  - Fix at least one "most annoying" UX or code issue from your notes.

## Quarterly – Deep Clean & Direction
- Architecture:
  - Review `/api/products` and ingestion (`ingestService`) structure.
  - Decide if discovery/external providers need adjusting or rate limits.
- Security:
  - Re-check middleware and `internalAuth` behavior.
  - Revisit Supabase RLS rules (if enabled) and tighten as needed.
- Data & features:
  - Review how many products/listings you have per category.
  - Consider adding new categories or retiring unused ones.
  - Review price-history plans and whether to extend `ProductPriceHistory`.
- Planning:
  - Choose the next 3–5 features or improvements for the coming quarter.

## Pre-Deploy Checklist
- Local:
  - Run `npm run build` and ensure it passes.
- Environment:
  - Confirm `DATABASE_URL`, `ADMIN_SECRET`, and `INTERNAL_API_KEY` are set in Vercel.
- Functionality:
  - On the preview deployment:
    - Homepage loads in both light and dark mode.
    - You can search and see results from `/api/products`.
    - The Assistant returns an answer for a populated search.
  - Confirm `/admin/*` and `/api/internal/*` routes prompt for credentials.
- Visual sanity:
  - Check that cards, ads, and Assistant layout look correct on desktop.

## Post-Deploy Checklist
- Monitor:
  - Watch Vercel logs for 4xx/5xx spikes after deployment.
- Data:
  - Check Supabase tables for unusual growth or broken rows.
- Feedback:
  - Capture any real user feedback in a simple list of "Next iteration" tasks.
