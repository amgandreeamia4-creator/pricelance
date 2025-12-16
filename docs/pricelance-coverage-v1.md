# PriceLance – v1 Coverage Spec

This document describes what the current version of PriceLance is *actually* meant to cover, so future changes stay honest and focused.

## Region Focus

- Primary region: **Romania**
- Also supports **EU stores that ship to Romania**.

All products and listings in the database should be realistically purchasable from Romania (directly or via EU shipping).

## Core Categories (v1)

PriceLance v1 focuses on a small, dense slice of the product universe:

- Laptops
- Smartphones
- Headphones & Earbuds
- Monitors
- Keyboards & Mice (peripherals)

These map to the canonical category keys defined in `src/config/catalog.ts`:

- `laptop`
- `smartphone`
- `headphones`
- `monitor`
- `peripheral`

## Depth Targets

For each core category, the target density is:

- ~30–50 distinct products per category.
- 3–5 listings per product (different stores or variants).
- 3–6 main stores overall.

Rough total targets:

- ~150–200 products across all core categories.
- ~450–800 listings across those products.

This is enough to make the app feel "alive" without requiring global coverage.

## Stores (Vendors)

The main stores we expect to support in v1 are:

- eMAG
- Altex
- PC Garage
- Flanco
- Amazon.de (with shipping to Romania)
- A generic "Other EU Store" bucket

These map to normalized store IDs in `src/config/catalog.ts`:

- `emag`, `altex`, `pcgarage`, `flanco`, `amazon_de`, `other_eu`.

## Future v1.5 Expansion

Once the core electronics coverage feels solid, we plan a small expansion into home and kitchen appliances:

- Coffee machines
- Vacuum cleaners
- Microwaves / toasters
- Blenders / food processors

These correspond to future category keys:

- `coffee_machine`
- `vacuum_cleaner`
- `microwave`
- `toaster`
- `blender`
- `food_processor`

The same depth goals apply: aim for a curated, realistic slice instead of total coverage.

## Intent

PriceLance v1 is not "all products online." It is a focused, honest comparison tool for a well-defined subset of products and stores, backed by a real database and stable APIs. Future features (price history, broader categories, discovery via external providers) should build on this foundation rather than replace it.
