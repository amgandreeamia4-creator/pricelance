# Documentation Index

This page is the main navigation entry point for the PriceLance documentation set.

## Documentation map

- [README.md](../README.md) — project overview, capabilities, quick start, and repository summary
- [docs/ONBOARDING.md](ONBOARDING.md) — local setup, environment configuration, database setup, and first import
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — system design, folder responsibilities, ingestion flow, and extension points
- [docs/DEPLOYMENT.md](DEPLOYMENT.md) — production deployment, environment management, and operational guidance
- [docs/BUYER_HANDOFF.md](BUYER_HANDOFF.md) — technical handoff overview for a buyer or operator
- [docs/WHY_PRICELANCE.md](WHY_PRICELANCE.md) — engineering rationale behind the current architecture
- [docs/DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) — production readiness checklist
- [docs/maintenance.md](maintenance.md) — routine maintenance runbook

## Recommended reading order

1. Start with [README.md](../README.md) for the overall product summary.
2. Continue with [docs/ONBOARDING.md](ONBOARDING.md) to get the local environment running.
3. Review [docs/ARCHITECTURE.md](ARCHITECTURE.md) for the design and data flow.
4. Use [docs/DEPLOYMENT.md](DEPLOYMENT.md) for production rollout and operations.
5. Refer to [docs/BUYER_HANDOFF.md](BUYER_HANDOFF.md) for commercial handoff context.

## Status notes

- Implemented: web app, Prisma-backed persistence, import tooling, provider configuration, admin and internal routes
- Optional: live provider integrations, background workers, and scheduled ingestion depending on environment support
- Future work: broader operational automation, more formal API documentation, and additional production hardening
