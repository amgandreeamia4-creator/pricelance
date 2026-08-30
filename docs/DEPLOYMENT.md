# Deployment Guide

This document is the production deployment reference for PriceLance. It is intended for a technical buyer or operator who needs to understand the operational requirements before taking ownership of the repository. For local setup, see [docs/ONBOARDING.md](ONBOARDING.md). For the repository design overview, see [docs/ARCHITECTURE.md](ARCHITECTURE.md). For handoff guidance, see [docs/BUYER_HANDOFF.md](BUYER_HANDOFF.md).

## 1. Supported deployment approaches

PriceLance is a Next.js application with a PostgreSQL-backed Prisma data layer and optional background ingestion workers. The repository is compatible with the following deployment patterns:

- Vercel for the web application and serverless API routes
- A generic Node.js host for the Next.js application and background workers
- A container-based deployment model where the web app and worker processes run separately

The primary deployment constraint is that the application depends on a PostgreSQL database and, for scheduled ingestion, Redis-backed background jobs.

## 2. Prerequisites

Before deploying, confirm that the following are available:

- A PostgreSQL database instance
- A Redis instance if you plan to use scheduled ingestion or the queue worker
- A deployment environment for the Next.js app
- Access to set environment variables in the deployment platform
- A process model for running the worker if you are not using a fully managed queue runtime

## 3. Environment variables

The deployment environment should include the full set of runtime configuration values required by the app. The repository already documents the main values in the onboarding flow and example environment file.

### Required runtime values

| Variable | Purpose |
|---|---|
| DATABASE_URL | PostgreSQL connection string for Prisma in the buyer-owned deployment environment |
| ADMIN_TOKEN | Server-side token used by admin routes via `x-admin-token` |
| INTERNAL_API_KEY | Server-side key used by internal APIs via `x-internal-key` |
| NEXT_PUBLIC_APP_BASE_URL | Public application base URL used by server-side flows |

The current owner’s live PostgreSQL/Supabase environment should not be treated as the permanent buyer deployment. The buyer should create or use their own managed PostgreSQL/Supabase instance and configure `DATABASE_URL` before production use.

### Optional values

| Variable | Purpose |
|---|---|
| REALTIME_PRODUCT_SEARCH_BASE_URL | RapidAPI-style provider endpoint |
| REALTIME_PRODUCT_SEARCH_API_KEY | Provider credential |
| eBay-related variables | Optional eBay integration credentials |
| BANGGOOD_API_KEY / BANGGOOD_API_SECRET | Optional affiliate ingestion credentials |
| REDIS_URL or REDIS_HOST / REDIS_PORT | Queue and worker connectivity |

The current codebase uses `NEXT_PUBLIC_APP_BASE_URL` in the runtime configuration and app setup. Use that variable consistently in the deployment environment; do not rely on any client-exposed secrets or alternate base-URL variables for actual auth or deployment configuration.

The deployment should not rely on local-only .env.local values. Every production setting should be injected through the platform environment.

## 4. PostgreSQL setup

PriceLance uses Prisma with PostgreSQL. A production deployment should use a managed Postgres instance or a dedicated database service rather than SQLite.

### Recommended approach

- Create a dedicated database for the application
- Ensure the database is reachable from the deployment environment
- Apply migrations after the environment is configured

### Prisma migration workflow

```bash
npx prisma migrate deploy
```

If the environment requires a first-time initialization, the repo’s onboarding flow also documents the use of:

```bash
npx prisma migrate dev --name init
```

In production, use the deployment-safe migration command rather than the development-only variant.

## 5. Redis requirements

The scheduler and worker rely on a queueing layer for ingestion jobs. Redis is the expected runtime dependency for background job processing.

If scheduled ingestion is required, ensure:

- Redis is reachable from the deployment environment
- The worker process is running
- The queue configuration matches the environment values

If Redis is not available, the web app may still function for basic browsing, but scheduled ingestion and worker-based imports should be treated as unavailable.

## 6. Worker and scheduler startup

The repository includes scripts for scheduler and worker-driven ingestion. In a production deployment, these processes should be started independently from the main web process.

Typical deployment separation:

- Web app process — serves the Next.js application and API routes
- Worker process — processes ingestion jobs from the queue
- Scheduler process — triggers recurring jobs based on configuration

A deployment operator should verify that the relevant scripts are started and remain healthy in production.

## 7. Build process

The application build is driven through the package scripts:

```bash
npm install
npm run build
```

The build should succeed before promotion to production. The deployment pipeline should fail fast if the build breaks.

## 8. Production checklist

Before deployment, confirm the following:

- The application builds successfully
- `DATABASE_URL` points to the buyer-owned production database
- Prisma migrations have been applied in that environment
- Required server-side secrets are set in the deployment environment
- The public base URL is correct
- Redis is configured if worker-based ingestion is required
- The deployment platform has the correct Node.js runtime version
- The current seller database and secrets are not being reused as the permanent production deployment

## 9. Verification after deployment

After the application is deployed, verify the main user path and the operational path.

### Functional verification

- Open the main application and confirm the home page loads
- Run a search and confirm results are returned if data is present
- Confirm admin routes are accessible only with the expected `x-admin-token` value
- Confirm internal endpoints are protected by the configured `x-internal-key`

### Operational verification

- Confirm database connectivity through the application and admin surfaces
- Confirm that seeded or imported data is visible
- Confirm that any configured ingestion worker is running and processing jobs

## 10. Backup recommendations

A production deployment should include a database backup strategy. At minimum:

- Schedule regular PostgreSQL backups
- Keep a recovery procedure documented
- Preserve seed scripts and migration history in source control

The application data should be treated as operationally important, especially product listings, history, and search logs.

## 11. Security recommendations

The deployment should be hardened in a production environment:

- Keep secrets in the deployment platform’s secret store, not in source control
- Rotate credentials after handoff or after any suspected exposure
- Restrict access to admin and internal routes to trusted operators
- Use HTTPS in production
- Avoid exposing internal-only secrets in client-side environment variables

## 12. Common deployment failures

Common issues include:

- Missing or incorrect DATABASE_URL
- Prisma migration failure due to database connectivity or schema drift
- Missing REDIS connectivity for queue jobs
- Incorrect base URL configuration for server-side routes
- Missing admin or internal secrets in the deployment environment
- Production build failure caused by missing dependencies or unsupported runtime versions

## 13. Rollback considerations

A rollback plan should be prepared in advance:

- Keep the previous build artifact or deployment revision available
- Ensure the database schema changes are reversible or safely applied
- Avoid destructive data changes during deployment unless they are fully understood
- If a deployment causes issues, revert the web app first and investigate the data layer separately

## 14. Upgrade strategy

Upgrades should be handled conservatively:

1. Review the current dependency versions and migration requirements.
2. Test the build and migration workflow in a staging environment.
3. Apply schema changes and verify them before production deployment.
4. Roll out the updated application after the deployment checks pass.
5. Monitor logs and operational health after release.

## 15. Operational ownership

The deployment should be owned by a team that can manage:

- database access and backups
- environment secrets
- deployment pipelines
- worker processes and Redis
- ingestion reliability and operational monitoring
