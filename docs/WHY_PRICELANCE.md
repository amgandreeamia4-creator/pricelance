# Why PriceLance is Structured This Way

This document explains the engineering rationale behind the main design decisions in PriceLance. It is intended for a technical buyer who wants to understand not only what the project does, but why it is built the way it is. For the repository overview, see [README.md](../README.md). For system design details, see [docs/ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Why provider abstraction was chosen

The application depends on data arriving from multiple source patterns, including CSV files, feeds, and provider-specific integrations. A provider abstraction keeps those differences behind a narrow interface so the rest of the system does not need to know the details of every data source.

This matters because source formats change over time. A provider abstraction reduces the risk that a change in one ingestion source will require invasive changes across the rest of the system.

## 2. Why the ingestion-first architecture was chosen

The core product is not a simple web frontend; it is a system for collecting, normalizing, and serving product data. That makes ingestion the most important operational concern. The architecture reflects that by treating ingestion as a first-class path rather than a side effect of UI interactions.

This approach is useful because product data quality, feed reliability, and source normalization usually determine whether the platform is valuable in practice.

## 3. Why Prisma was selected

Prisma provides a practical way to define a relational schema and interact with it in a typed manner. For a repository like PriceLance, that means the data model can be expressed clearly and consumed consistently across routes, services, and import flows.

The choice also helps reduce boilerplate around persistence and makes it easier to evolve the schema as the system grows.

## 4. Why PostgreSQL was selected

PostgreSQL is a reliable relational database choice for a system that needs to store structured product records, listing data, historical price points, and operational metadata. It fits the current modeling needs well and provides enough flexibility for future reporting and analysis features.

The repository currently uses the database as a durable system of record rather than a temporary cache. That is an important design choice because it makes imported data and search state easier to reason about and maintain.

## 5. Why background workers and queues exist

Some ingestion tasks are better handled outside the request lifecycle. CSV imports, scheduled feed processing, and other longer-running workflows benefit from an asynchronous model because they can be retried, observed, and paced more effectively.

The queue and worker design exists to separate the operational concern of ingestion from the user-facing web experience. That separation also makes failure handling more manageable.

## 6. Why the admin tooling exists

The admin subsystem is not only a convenience layer. It is an operational necessity. A platform that ingests data from outside sources needs a way to inspect the import process, validate data quality, and troubleshoot issues without diving into raw database tables every time.

The admin tooling exists to make the system maintainable by operators and to reduce the cost of diagnosing ingestion problems.

## 7. Why modularity matters

PriceLance is a system with multiple concerns that evolve at different rates: UI, ingestion, provider integrations, auth, database access, and analytics. Modularity matters because each of those areas has different failure modes and different change frequency.

A modular structure makes it easier to extend the product, isolate issues, and add new functionality without rewriting the entire platform.

## 8. Scalability considerations

The current architecture is deliberately simple, but it has a clear path to scale. The main scalability concerns are:

- the size of the product and listing dataset
- the number of concurrent import jobs
- the number of search and browse requests served by the web layer
- the operational overhead of monitoring ingestion and data quality

The existing structure supports incremental scaling through better deployment separation, queue observability, and database performance tuning. It is not a fully distributed architecture, but it is well suited to a pragmatic growth path.

## 9. Design trade-offs

The project reflects a few deliberate trade-offs:

- It favors clarity and maintainability over a highly abstract framework layer.
- It keeps operational logic close to the domain rather than hiding it behind a large number of generic abstractions.
- It uses a practical ingestion pipeline rather than a fully event-driven architecture.

Those trade-offs are appropriate for a platform that needs to be understandable and extendable without becoming overly complex.

## 10. Future extensibility

The architecture leaves room for future growth in several directions:

- adding new providers and input formats
- increasing automation around import scheduling and monitoring
- improving analytics and historical reporting
- expanding the admin surface for operational control
- separating ingestion from the web application more aggressively as volume grows

The system is not designed around one fixed data source or one fixed workflow. That is part of its value.
