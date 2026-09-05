# Buyer Handoff Guide
This document is written for a technical buyer or operator evaluating PriceLance as an engineering asset. It provides a factual overview of the repository, its current capabilities, deployment requirements, and ownership expectations.

For the implementation overview, see [README.md](../README.md).
For local setup, see [docs/ONBOARDING.md](ONBOARDING.md).
For production deployment, see [docs/DEPLOYMENT.md](DEPLOYMENT.md).

## 1. Project overview
PriceLance is a Next.js application for product catalog management, listing ingestion, price comparison, price-history storage, search, and operational administration.

The repository is structured around a database-first architecture with separate product and store-listing records. It is designed to support curated catalog data as well as controlled ingestion from external sources.

The repository includes:

- a Next.js web application
- Prisma-based persistence with PostgreSQL
- product, listing, and price-history models
- CSV and feed-based import workflows
- provider abstractions for source integrations
- admin and internal operational surfaces
- optional background ingestion support through Redis/BullMQ

## 2. Current feature set
The current implementation includes:

- product search and category browsing
- canonical product and store-listing records
- multiple offers per product
- price-history storage and related UI
- product detail and merchant-outbound flows
- CSV/feed import tooling
- provider configuration and integration abstractions
- admin operational pages
- database health and catalog-management tooling
- responsive public UI for desktop and mobile layouts

The application should be understood as a functional engineering product prepared for transfer to a new owner. Some integrations are optional or dormant and should not be assumed to be active simply because their implementation remains in the repository.

## 3. Repository contents
The repository is organized around the following areas:

- `src/app` — application routes, pages, and API handlers
- `src/components` — reusable UI components
- `src/lib` — services, authentication, provider adapters, and ingestion logic
- `src/config` — configuration and environment-driven behavior
- `prisma` — database schema, migrations, and seed logic
- `scripts` — maintenance and ingestion scripts
- `tests` and `fixtures` — test and sample-data support
- `docs` — technical, operational, and buyer-facing documentation

## 4. Technologies used

| Area | Technology |
|---|---|
| Web framework | Next.js 16 |
| Language | TypeScript |
| UI | React + Tailwind CSS |
| Data layer | Prisma + PostgreSQL |
| Database platform | PostgreSQL / Supabase-compatible |
| Background jobs | BullMQ + Redis |
| Testing | Vitest |
| Linting | ESLint |
| Deployment | Vercel-compatible Next.js deployment |

## 5. Documentation map
The main documentation entry points are:

- `README.md` — project overview and quick start
- `docs/ONBOARDING.md` — local setup and first-run process
- `docs/ARCHITECTURE.md` — architecture and repository structure
- `docs/DEPLOYMENT.md` — production deployment guidance
- `docs/DEPLOYMENT_CHECKLIST.md` — deployment readiness checklist
- `docs/MAINTENANCE_GUIDE.md` — ongoing maintenance guidance
- `docs/BUYER_HANDOFF.md` — ownership and transfer guidance
- `docs/WHY_PRICELANCE.md` — product and project rationale

A new owner should normally start with `README.md`, then review onboarding, architecture, deployment, and this buyer handoff document.

## 6. Deployment overview
PriceLance requires:

- a PostgreSQL-compatible database
- a runtime environment for the Next.js application
- appropriate production environment variables
- Redis and queue infrastructure only when background ingestion workflows are enabled

The web application and optional worker processes should be treated as separate runtime concerns when queue-based ingestion is used.

The buyer should deploy PriceLance using buyer-owned infrastructure and credentials.

## 7. Environment overview
The application uses environment variables for:

- database connectivity via `DATABASE_URL`
- admin protection via `ADMIN_TOKEN`
- internal API authentication via `INTERNAL_API_KEY`
- application URL configuration via `NEXT_PUBLIC_APP_BASE_URL`
- production admin credentials via `ADMIN_USER` and `ADMIN_PASSWORD`
- optional provider, email, analytics, advertising, Redis, and scheduled-ingestion configuration

The repository includes `.env.example` as the configuration template.

The seller's live Supabase/PostgreSQL environment and credentials are not part of the permanent product handoff. The buyer should create or select a buyer-owned PostgreSQL/Supabase environment and configure `DATABASE_URL` for that deployment.

The seller is providing the application code, database schema, migrations, configuration template, setup guidance, and documentation. The buyer is responsible for infrastructure, credentials, deployment, backups, and ongoing operational ownership.

## 8. Database overview
The Prisma schema defines the principal persistence entities used by the application, including:

- `Product`
- `Listing`
- `ProductPriceHistory`
- `Merchant`
- `MerchantFeedRun`
- `SearchLog`
- `SavedSearch`

The data model is centered on canonical product records with store-specific listing records. This structure supports comparison across merchants while allowing individual offers and price-history records to remain associated with their source listings.

The repository contains the Prisma migration history required to recreate the database schema in a new PostgreSQL environment.

## 9. Admin overview
The repository contains internal/admin surfaces for tasks such as:

- catalog management
- data importing
- system and database checks
- category management
- ingestion-related operations
- search and catalog analysis

These pages are intended as operational tooling rather than a generalized enterprise administration platform.

Production admin access should be protected with buyer-owned credentials and secrets.

## 10. Provider and ingestion overview
Provider abstractions allow PriceLance to support multiple source patterns without coupling the entire application to a single provider.

The repository contains implementation and configuration for several ingestion patterns, including curated/static catalog data and optional external-source integrations.

Important distinction:

- **Implemented** means the relevant code exists in the repository.
- **Configured** means the deployment has the necessary settings or credentials.
- **Active** means the integration is currently enabled and intended for production use.

These states are not interchangeable.

The buyer should review provider configuration and activate only the sources appropriate for their own deployment, commercial relationships, credentials, and legal/operational requirements.

## 11. Known limitations and operational considerations
The repository is functional, but a buyer should understand the following:

- some provider integrations are optional or dormant
- external provider availability and credentials are environment-dependent
- background ingestion requires additional Redis/queue infrastructure
- import workflows may require source-specific validation and monitoring
- admin tooling is operational rather than a fully generalized management suite
- production infrastructure, monitoring, backups, and credentials remain the buyer's responsibility

These are normal ownership considerations for an extensible engineering product and should be evaluated according to the buyer's intended deployment model.

## 12. Recommended first steps after acquisition
A sensible post-acquisition sequence is:

1. Create or select the buyer-owned PostgreSQL/Supabase environment.
2. Configure `DATABASE_URL` and the required application secrets.
3. Review `.env.example` and production configuration.
4. Run the documented database migration/setup process.
5. Deploy the web application in the buyer-owned environment.
6. Verify the public search, category, product-detail, and merchant-outbound flows.
7. Review admin access and internal API credentials.
8. Decide which optional ingestion/provider integrations should be enabled.
9. Configure monitoring, backups, and operational ownership.
10. Rotate or replace any credentials associated with services the buyer chooses to use.

## 13. Suggested future roadmap
Potential future development areas include:

- expanding merchant/provider coverage
- improving ingestion reliability and observability
- adding additional catalog automation
- strengthening analytics and administration
- improving production monitoring
- expanding regional or EU coverage
- adding additional monetization integrations

These are opportunities for the new owner rather than prerequisites for the current application package.

## 14. Maintenance expectations
Ongoing maintenance may include:

- database health and migrations
- provider/API credential management
- ingestion monitoring and troubleshooting
- import-quality review
- search relevance and catalog-quality review
- production monitoring
- security updates and dependency maintenance
- backups and recovery procedures

The repository includes `docs/MAINTENANCE_GUIDE.md` for operational guidance.

## 15. Transfer checklist
Before completing the handoff, confirm that:

- repository ownership/access has been transferred
- the buyer has access to the required deployment environment
- the buyer has created or selected their own PostgreSQL/Supabase environment
- `DATABASE_URL` is configured for the buyer-owned database
- production admin credentials have been configured by the buyer
- deployment responsibilities are understood
- optional providers have been reviewed
- third-party credentials are owned or controlled by the buyer
- backups and monitoring are configured in the buyer's environment

The seller does not provide ongoing database administration or infrastructure management after transfer unless separately agreed as part of the transaction.

## 16. Credentials and secret handling
The buyer should treat all production credentials as buyer-owned operational secrets.

Recommended practices include:

- keep secrets out of source control
- use the `.env.example` template rather than copying seller credentials
- configure `ADMIN_TOKEN` and `INTERNAL_API_KEY` with buyer-generated values
- configure production admin credentials in the buyer's environment
- use buyer-owned database credentials
- review third-party provider credentials before enabling integrations
- store production secrets in the deployment platform's secret-management system
- maintain independent backups of the buyer-owned database

The seller's live database credentials are not intended to become part of the buyer's permanent environment.

## 17. What is included in the handoff
The application handoff consists of the PriceLance source repository and its associated technical documentation, including:

- application source code
- Prisma schema and migration history
- configuration template
- setup and deployment documentation
- operational and maintenance documentation
- test and development support included in the repository
- provider/integration abstractions present in the codebase

The buyer is responsible for supplying or creating their own:

- PostgreSQL/Supabase infrastructure
- deployment environment
- domain and DNS configuration
- production secrets
- third-party provider accounts and credentials
- Redis/queue infrastructure if required
- analytics, advertising, email, or affiliate accounts they choose to activate
- production backups and monitoring

PriceLance is transferred as an engineering product. The seller does not retain responsibility for the buyer's infrastructure, database administration, credentials, or ongoing operational continuity after the transaction.
