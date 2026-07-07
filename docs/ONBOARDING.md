# Onboarding Guide

This guide is the primary starting point for a technical buyer who wants to run PriceLance locally and understand the minimum setup required before evaluating the application. For the repository-wide design view, see [docs/ARCHITECTURE.md](ARCHITECTURE.md). For production deployment guidance, see [docs/DEPLOYMENT.md](DEPLOYMENT.md).

## 1. Prerequisites

Before you begin, make sure the following tools are available:

- Node.js 20 or newer
- npm
- PostgreSQL server
- Redis if you plan to run the scheduled ingestion worker locally

If you do not need live provider integrations, the app can still be run locally with the database and basic seed data.

## 2. Clone and install

```bash
git clone <repository-url>
cd pricelance
npm install
```

## 3. Configure environment variables

Copy the example environment file and populate the required values:

```bash
cp .env.example .env.local
```

At a minimum, set the following in .env.local:

- DATABASE_URL — PostgreSQL connection string
- ADMIN_USER and ADMIN_PASSWORD — admin credentials for protected admin routes
- ADMIN_TOKEN — server-side token used by admin and internal APIs
- INTERNAL_API_KEY — required by internal routes
- NEXT_PUBLIC_APP_BASE_URL — the local base URL, typically http://localhost:3000

Optional values are used for specific providers and integrations, such as RapidAPI, eBay, or Banggood-style affiliate flows. The repository currently references NEXT_PUBLIC_APP_BASE_URL in shared configuration and NEXT_PUBLIC_BASE_URL in some admin-related flows; confirm the expected variable in your deployment target before rollout.

> Keep secrets out of source control. The repository should treat .env.local as local-only configuration.

## 4. Prepare the database

Create a PostgreSQL database and point DATABASE_URL to it.

Then run:

```bash
npx prisma migrate dev --name init
```

If you prefer a schema push for local experimentation, Prisma can also be used that way. For a cleaner initial setup, migrations are the recommended path.

## 5. Seed sample data

The repository includes a seed script for initial sample data:

```bash
npm run db:seed
```

This populates the database with starter records so the app has data to display and search.

## 6. Start the application

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 7. Access the admin area

The admin surfaces are protected by server-side configuration. Set the following before trying the admin pages:

- ADMIN_USER
- ADMIN_PASSWORD
- ADMIN_TOKEN
- INTERNAL_API_KEY

Once configured, open the admin routes such as:

- /admin/import-csv
- /admin/system-check
- /admin/merchant-feeds

## 8. Run your first import

A practical first test is to import one of the sample CSV fixtures via the admin import UI.

1. Start the app.
2. Open /admin/import-csv.
3. Upload a sample CSV file from the fixtures directory.
4. Submit the import.
5. Confirm that products and listings are created or updated.
6. Return to the main application and search for the imported product.

If you are testing provider-specific ingestion, ensure the relevant provider credentials and feature flags are enabled in .env.local.

## 9. Run the ingestion worker and scheduler

If you plan to evaluate scheduled ingestion or queue-based imports, you will also need Redis running and the worker process started.

Typical local setup:

```bash
# Start Redis if available on your machine
# Then run the scheduler script
npm run dev:ingestion-scheduler
```

The scheduler and worker are intended for background ingestion jobs; they are not required for basic local browsing and seeding.

## 10. Troubleshooting common issues

### Prisma connection errors

Symptoms:
- Prisma cannot connect to the database
- Migration commands fail immediately

Checks:
- Confirm DATABASE_URL is correct
- Confirm PostgreSQL is running
- Confirm the target database exists

### Missing or blank data after startup

Symptoms:
- Homepage loads but search results are empty
- Admin pages report missing data

Checks:
- Run npm run db:seed
- Confirm the database migration completed successfully
- Confirm imports were executed successfully

### Admin routes are blocked

Symptoms:
- Admin pages return access errors
- Internal routes reject requests

Checks:
- Verify ADMIN_TOKEN and INTERNAL_API_KEY are set in .env.local
- Verify the same values are used consistently by any tooling or scripts calling internal routes

### Provider integrations do not work

Symptoms:
- Live provider flows fail silently or return no data

Checks:
- Confirm the relevant provider environment variables are present
- Confirm the provider feature flags are enabled
- Note that some integrations are optional and are only relevant when invoked

### Scheduled ingestion does not run

Symptoms:
- No background jobs appear
- Worker does not process imports

Checks:
- Ensure Redis is running
- Confirm the scheduler and worker processes are started
- Review the relevant ingestion scripts and queue configuration

## 11. Recommended first-pass validation

After the app is running, a simple validation checklist is:

1. Open the main search page and confirm it renders.
2. Confirm seeded or imported products are visible.
3. Run an import through the admin UI.
4. Confirm the imported records appear in search results.
5. Check that admin and internal routes are protected by the configured secrets.
