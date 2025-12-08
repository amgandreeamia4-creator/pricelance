# Env notes for deployment

This project is currently developed against a local SQLite database (see `prisma/schema.prisma`).
For production / hosted environments (e.g. Vercel + managed Postgres/MySQL), configure
the following environment variables.

## Database

- `DATABASE_URL`
  - Required in production.
  - Should point to your hosted database (Postgres/MySQL/etc.).
  - In local development, if `DATABASE_URL` is not set, the app falls back to `file:./dev.db`.

## Providers

These control which product providers are enabled at runtime.

- `PROVIDER_REALSTORE_ENABLED="true"`
  - Real-time product search provider (RapidAPI-based aggregator).
  - **Recommended: true in production.**

- `PROVIDER_STATIC_ENABLED="false"`
  - Static catalog provider for development/testing.
  - **Recommended: false in production.**

- `PROVIDER_DUMMYJSON_ENABLED="false"`
  - DummyJSON demo provider.
  - **Recommended: false in production.**

## Real-time product search (RapidAPI)

- `REALTIME_PRODUCT_SEARCH_BASE_URL`
  - Default: `https://real-time-product-search.p.rapidapi.com`
  - Override only if RapidAPI changes the base URL.

- `REALTIME_PRODUCT_SEARCH_API_KEY`
  - Required when `PROVIDER_REALSTORE_ENABLED` is true.
  - Your RapidAPI key for the Real-Time Product Search API.

## Internal API auth

- `INTERNAL_API_KEY`
  - Strong random secret used to protect internal/administrative routes.
  - Must be set and kept private in production.
