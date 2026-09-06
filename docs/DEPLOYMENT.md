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

**Provider integrations and credentials:** Implementation and configuration code exists in the repository for RapidAPI-style search, eBay, Banggood, and affiliate integrations. However, some or all of these integrations may be dormant, demo-only, or disabled in the current deployment. Do not assume they are production-active merely because configuration variables or environment setup exists. For clarity on which integrations are currently implemented, enabled, and active in the codebase, see [docs/BUYER_HANDOFF.md](BUYER_HANDOFF.md).

The current codebase uses `NEXT_PUBLIC_APP_BASE_URL` in the runtime configuration and app setup. Use that variable consistently in the deployment environment; do not rely on any client-exposed secrets or alternate base-URL variables for actual auth or deployment configuration.

The deployment should not rely on local-only .env.local values. Every production setting should be injected through the platform environment.

## 4. PostgreSQL setup

PriceLance uses Prisma with PostgreSQL. A production deployment should use a managed Postgres instance or a dedicated database service rather than SQLite.

### Recommended approach

- Create a dedicated database for the application
- Ensure the database is reachable from the deployment environment
- Apply migrations after the environment is configured

### Prisma migration workflow

**For production deployment**, use:

```bash
npx prisma migrate deploy
```

This is the production-safe migration command and should be used for all production deployments.

**For local development only**, the repository's onboarding flow documents:

```bash
npx prisma migrate dev --name init
```

This command is for local development and should not be used as the production migration procedure. Always use `npx prisma migrate deploy` in production.

## 5. Redis requirements

The scheduler and worker rely on a queueing layer for ingestion jobs. Redis is the expected runtime dependency for background job processing.

**Redis is required only if the buyer enables queue-based or scheduled ingestion.** Basic web browsing and search functionality can operate without Redis as long as the application has database data available.

If scheduled ingestion is required, ensure:

- Redis is reachable from the deployment environment
- The worker process is running
- The queue configuration matches the environment values

If Redis is not available, the web app may still function for basic browsing and search, but scheduled ingestion and worker-based imports should be treated as unavailable.

## 6. Worker and scheduler startup

The repository includes scripts for scheduler and worker-driven ingestion. **These components are required only when the buyer enables queue-based or scheduled ingestion.** If the buyer does not plan to use automated ingestion, the worker and scheduler processes are optional.

For deployments that require background ingestion, separate these processes from the main web process:

- Web app process — serves the Next.js application and API routes
- Worker process — processes ingestion jobs from the queue (if ingestion is enabled)
- Scheduler process — triggers recurring jobs based on configuration (if ingestion is enabled)

A deployment operator should verify that the relevant scripts are started and remain healthy if ingestion is required.

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
- `DATABASE_URL` points to the buyer-owned production database (not the seller's live environment)
- Prisma migrations have been applied in that environment using `npx prisma migrate deploy`
- Required server-side secrets are set in the deployment environment
- The public base URL is correct
- Redis is configured if worker-based ingestion is required
- The deployment platform has the correct Node.js runtime version
- The buyer has created and configured buyer-owned credentials for `ADMIN_TOKEN`, `INTERNAL_API_KEY`, and any provider integrations
- The seller's live database and secrets are not being reused as the permanent production deployment

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
- Do not reuse the seller's live credentials. Create and use buyer-owned production credentials for `ADMIN_TOKEN`, `INTERNAL_API_KEY`, and any provider integrations
- Rotate all inherited or shared credentials immediately upon handoff
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
3. Apply schema changes and verify them before production deployment using `npx prisma migrate deploy`.
4. Roll out the updated application after the deployment checks pass.
5. Monitor logs and operational health after release.

## 15. Seed data

The repository includes seed scripts (e.g., `npm run db:seed`). Where applicable, these provide optional development or demo data. **Buyers should not blindly run seed scripts against a production database**, as they may overwrite, reset, or corrupt production data. Use seed scripts only in development environments or with explicit understanding of their impact. Refer to individual seed script documentation before running them in any environment.

## 16. Operational ownership

The deployment should be owned by a team that can manage:

- database access and backups
- environment secrets and credential rotation
- deployment pipelines
- worker processes and Redis (if ingestion is enabled)
- ingestion reliability and operational monitoring (if applicable)
