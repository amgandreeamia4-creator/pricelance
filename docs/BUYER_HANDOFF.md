# Buyer Handoff Guide

This document is written for a technical buyer or operator who is evaluating PriceLance as an engineering asset. It is intended to provide a factual overview of the repository, its current capabilities, and the operational expectations that come with taking ownership of it. For the implementation overview, see [README.md](../README.md). For local setup, see [docs/ONBOARDING.md](ONBOARDING.md). For production deployment, see [docs/DEPLOYMENT.md](DEPLOYMENT.md).

## 1. Project overview

PriceLance is a Next.js application for ingesting product data, normalizing listings, storing price-history information, and serving search and admin experiences. The repository is structured around an ingestion-first architecture rather than a purely presentational frontend.

The repository includes:

- a Next.js web application
- Prisma-based persistence with PostgreSQL
- import workflows for CSV and feed-based sources
- provider abstractions for source integrations
- admin surfaces for operational tasks
- background ingestion support through queue-based processing

## 2. Current feature set

The current implementation includes the following capabilities:

- Product and listing ingestion from multiple source patterns
- Product search and browse flows
- Price-history storage and related UI surfaces
- Admin and internal routes for operational workflows
- Import tooling for CSV-based and affiliate-style data
- A provider configuration layer for enabling or disabling integrations

The repository should be treated as a functional engineering platform rather than a finished consumer product with fully polished operations around every workflow. The documentation below distinguishes between implemented capabilities, optional integrations, and future work.

## 3. Repository contents

The repository is organized around the following high-level areas:

- src/app — application routes, pages, and API handlers
- src/components — reusable UI components
- src/lib — services, auth logic, provider adapters, and ingestion implementation
- src/config — configuration and environment-driven feature flags
- prisma — schema and seed logic
- scripts — maintenance and ingestion scripts
- tests and fixtures — sample data and regression helpers
- docs — operational and buyer-facing documentation

## 4. Technologies used

| Area | Technology |
|---|---|
| Web framework | Next.js |
| Language | TypeScript |
| Data layer | Prisma + PostgreSQL |
| Background jobs | BullMQ and Redis |
| Testing | Vitest |
| Linting | ESLint |

## 5. Documentation map

The repository includes the following documentation entry points:

- README.md — high-level overview and quick start
- docs/ONBOARDING.md — local setup and first-run process
- docs/ARCHITECTURE.md — architecture and repository map
- docs/DEPLOYMENT.md — deployment and operational setup
- docs/maintenance.md — maintenance runbook
- docs/DEPLOYMENT_CHECKLIST.md — deployment readiness checklist

A new owner should start with the README and then move through onboarding, architecture, and deployment documentation.

## 6. Deployment overview

PriceLance requires:

- a PostgreSQL database
- a runtime environment for the Next.js app
- Redis if queue-based ingestion is used
- environment variables for auth, base URL, and provider configuration

The deployment should be treated as a multi-service exercise if background ingestion is required. The web application and the worker processes should not be assumed to be the same runtime concern.

## 7. Environment overview

The application relies on environment variables for:

- database connection via `DATABASE_URL`
- admin protection via `ADMIN_TOKEN` and `x-admin-token`
- internal API access via `INTERNAL_API_KEY` and `x-internal-key`
- base URL configuration via `NEXT_PUBLIC_APP_BASE_URL`
- provider credentials and feature flags

This repository is a deployable application package. The current owner’s live Supabase/Postgres environment is not part of the permanent product handoff. The buyer should configure their own managed PostgreSQL/Supabase instance and set `DATABASE_URL` for that environment before production use.

The seller is providing the application structure, schema, setup guidance, and handoff documentation; the buyer is responsible for the infrastructure, credentials, deployment environment, and ongoing operational ownership.

## 8. Database overview

The Prisma schema defines the main persistence entities used by the system:

- Product
- Listing
- ProductPriceHistory
- Merchant
- MerchantFeedRun
- SearchLog
- SavedSearch

The database design is centered on canonical product records plus store-specific listing records. This is a practical model for price comparison and feed ingestion workflows.

## 9. Admin overview

The repository contains admin and internal operational surfaces for:

- importing data
- reviewing system health
- viewing ingestion-related state
- monitoring data and search activity

These surfaces are important for day-to-day operation, but they should be treated as internal tools rather than fully polished business-facing admin software.

## 10. Provider overview

The provider abstraction is a key part of the architecture. It allows the system to ingest from multiple source patterns without forcing every ingestion path through a single, hard-coded implementation.

The repository currently contains provider-related configuration and integration points for several source patterns, including static catalog data, demo providers, and external product-search style integrations. A new owner should review the provider layer directly before adding new sources.

## 11. Known limitations

The repository is functional, but the following limitations should be understood by a buyer:

- Some documentation remains operational rather than fully polished
- Provider integrations may be optional and environment-dependent
- Background ingestion depends on Redis and queue processing infrastructure
- The admin subsystem is functional but should be treated as an operational tool rather than a fully generalized management platform
- Some operational workflows require manual verification and monitoring

## 12. Recommended first improvements

If the repository is being stabilized after acquisition, the following are sensible first steps:

1. Create or select the buyer-owned PostgreSQL/Supabase environment and set `DATABASE_URL` for it.
2. Review environment variable naming and deployment assumptions.
3. Verify the deployment path for the web app, worker, and scheduler separately.
4. Confirm the production database migration workflow.
5. Consolidate any deployment and operations notes into a single operational playbook.
6. Review secrets rotation and access management before the repository is handed over to a team.

## 13. Recommended roadmap

A reasonable roadmap for ownership could include:

- secure and standardize environment configuration
- formalize production deployment and monitoring
- improve import reliability and observability
- expand provider coverage in a controlled way
- strengthen admin and internal tooling for day-to-day operations

## 14. Maintenance expectations

The application will require ongoing maintenance in the following areas:

- database health and migrations
- ingestion reliability and provider credential rotation
- operational monitoring for the web app and workers
- periodic review of import quality and search relevance
- security review of admin and internal access paths

## 15. Suggested transfer checklist

Before handing the repository over to a buyer or operator, the following should be confirmed:

- Repository access is available to the new owner
- Production environment variables are documented and stored securely in the buyer-owned environment
- The buyer-owned PostgreSQL/Supabase database is configured and `DATABASE_URL` is set for that environment
- Deployment pipeline and runtime responsibilities are defined
- The current deployment URL and environment names are documented
- Secret rotation is treated as a buyer-owned operational task for their own environment, not as a requirement to reuse the seller’s live database credentials

## 16. Credentials and secret rotation guidance

Any buyer taking ownership should treat the repository as containing operationally sensitive values until they have verified the environment.

Recommended actions:

- configure the buyer-owned PostgreSQL/Supabase environment and set `DATABASE_URL` for that deployment
- keep server-side secrets out of client-side configuration
- review `ADMIN_TOKEN` and `INTERNAL_API_KEY` before production use
- verify that any third-party provider credentials are still authorized for the intended deployment
- do not assume the current owner’s live database or credentials are part of the permanent handoff

## 17. What should be delivered to the buyer at handoff

A complete handoff package should include:

- repository access and deployment access
- the current application documentation set
- the current schema and migration history
- deployment instructions for the buyer-owned environment
- a note that the buyer must provide or configure their own PostgreSQL/Supabase instance and `DATABASE_URL`
- a list of active providers and their credentials in the buyer’s environment
- a summary of the current data import workflow
- a list of known operational issues or limitations
- the current documentation set and any internal runbooks

The seller is not providing ongoing database administration; the buyer is responsible for their own infrastructure, database ownership, backups, and operational continuity.
