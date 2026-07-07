# PriceLance

PriceLance is a Next.js application for ingesting product feeds, normalizing listings, storing price history, and serving product search and admin APIs. It is designed as an ingestion-first price intelligence platform that can be used for price comparison, affiliate data collection, or catalog enrichment.

## What PriceLance does

- Ingests product data from CSV files, URL-based feeds, and affiliate-style providers.
- Normalizes incoming listings into a consistent schema.
- Stores products, listings, price history, search activity, and merchant metadata in PostgreSQL.
- Exposes public search and product APIs plus internal and admin tooling for imports and monitoring.

## Core technologies

- Next.js with the App Router and TypeScript
- Prisma ORM with PostgreSQL
- BullMQ and Redis for ingestion scheduling and worker processing
- Vitest and ESLint for testing and linting

## High-level architecture

PriceLance separates the system into four layers:

1. Provider and feed adapters that collect source data.
2. An ingestion pipeline that normalizes and imports records into the database.
3. Public and internal APIs that read from the database and return products, listings, and analytics.
4. Admin surfaces for imports, monitoring, and operational review.

## Key capabilities

- Multi-provider ingestion support for static catalog data, demo providers, RapidAPI-style search, eBay, and Banggood-style affiliate flows.
- CSV import workflows for merchant and affiliate-style inventories.
- Product normalization, category handling, and basic deduplication during import.
- Search and browse APIs for frontend consumption.
- Admin tools for CSV import, system checks, and ingestion monitoring.

## Quick start

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database
- Redis if you plan to run the scheduler and worker locally

### Install and run locally

```bash
npm install
cp .env.example .env.local
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Then open http://localhost:3000.

### Required environment setup

At minimum, configure:

- DATABASE_URL
- ADMIN_USER and ADMIN_PASSWORD
- ADMIN_TOKEN
- INTERNAL_API_KEY
- NEXT_PUBLIC_APP_BASE_URL

Additional provider credentials are optional unless you plan to use those integrations.

## Repository structure

- src/app — Next.js app routes, pages, and API handlers
- src/components — UI components
- src/lib — shared services, provider adapters, ingestion logic, and auth helpers
- src/config — configuration and feature-flag definitions
- prisma — Prisma schema and seed data
- scripts — maintenance and ingestion scripts
- tests and fixtures — sample data and test utilities
- docs — buyer-facing documentation and operational guides

## Documentation

The repository now includes a consolidated documentation pack for onboarding, architecture, deployment, and handoff:

- [docs/INDEX.md](docs/INDEX.md) — documentation hub and reading order
- [docs/ONBOARDING.md](docs/ONBOARDING.md) — local setup, environment configuration, database setup, and first import
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system overview, folder responsibilities, ingestion flow, and extension points
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — production deployment, environment management, and operational guidance
- [docs/BUYER_HANDOFF.md](docs/BUYER_HANDOFF.md) — buyer-facing overview for ownership transfer
- [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) — deployment and production verification checklist
- [docs/maintenance.md](docs/maintenance.md) — routine maintenance guidance

## Current project status

The repository includes a functional local development workflow, import tooling, a Prisma-backed data model, and several provider integrations. The documentation in this pack is intended to make the project understandable and operational for a technical buyer without tracing the implementation directly.

## License

No license file is included in the repository yet. Add an explicit license before public distribution or commercial handoff.

---

