# Category System Architecture Diagram

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  src/config/categories.ts                       │
│                   (SINGLE SOURCE OF TRUTH)                      │
│                                                                 │
│  Type Definitions:                                              │
│  • CategoryFamilySlug (6 values)                                │
│  • CategorySlug (17 values)                                     │
│  • CanonicalCategoryLabel (17 values)                           │
│                                                                 │
│  CATEGORY_TREE: Array<{family, slug, label}>                   │
│  Helper Functions:                                              │
│  • getCategoryBySlug(slug)                                      │
│  • getCategoryByLabel(label)                                    │
│  • dbCategoryFromSlug(slug) → CanonicalCategoryLabel            │
│  • slugFromDbCategory(dbValue) → CategorySlug                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┬──────────────┐
                 │            │            │              │
                 ▼            ▼            ▼              ▼
        ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │  Homepage    │ │   API    │ │Inference │ │  Legacy      │
        │              │ │ Endpoint │ │ Engine   │ │  Compat      │
        │ src/app/     │ │          │ │          │ │              │
        │ page.tsx     │ │ src/app/ │ │ src/lib/ │ │src/config/   │
        │              │ │api/      │ │category  │ │category      │
        │              │ │products/ │ │Inference │ │Filters.ts    │
        │              │ │route.ts  │ │.ts       │ │              │
        └──────────────┘ └──────────┘ └──────────┘ └──────────────┘
             │                │              │              │
        Displays:         Returns:      Returns:       Maintains:
        • 8 tech          products     canonical        CategoryKey
          categories        with       category         enum for
        • Uses CATEGORY_    correct    labels for       backwards
          KEY_TO_SLUG       category   database         compat
          mapping           slug
```

## Request/Response Flow

```
USER ACTION: Click Category Pill
    │
    ▼
┌─────────────────────────────────────────┐
│ Home (page.tsx)                         │
│ - Reads CATEGORY_KEY_TO_SLUG mapping    │
│ - Maps "Phones" → "phones" slug         │
└─────────────────────────────────────────┘
    │
    ├─→ API Request: /api/products?categorySlug=phones
    │
    ▼
┌─────────────────────────────────────────┐
│ API Route (route.ts)                    │
│ 1. Reads categorySlug="phones"          │
│ 2. Calls dbCategoryFromSlug("phones")   │
│ 3. Gets "Phones" (CanonicalCategoryLabel)
│ 4. Filters: WHERE category = "Phones"   │
│ 5. Returns matched products             │
└─────────────────────────────────────────┘
    │
    ▼
API Response: 
{
  "products": [
    {
      "id": "...",
      "name": "iPhone 15",
      "category": "Phones",    ← Matches filter
      "listings": [...]
    },
    {
      "id": "...",
      "name": "Samsung S24",
      "category": "Phones",    ← Matches filter
      "listings": [...]
    }
  ]
}
```

## Category Tree Structure (17 Total)

```
CATEGORY_TREE
│
├─ Tech (9 categories)
│  ├─ laptops              → Laptops
│  ├─ phones               → Phones
│  ├─ phone-cases-protection → Phone Cases & Protection
│  ├─ monitors             → Monitors
│  ├─ tv-display           → TV & Display
│  ├─ headphones-audio     → Headphones & Audio
│  ├─ keyboards-mice       → Keyboards & Mice
│  ├─ tablets              → Tablets
│  └─ smartwatches         → Smartwatches
│
├─ Gifts & Lifestyle (3 categories)
│  ├─ personal-care        → Personal Care
│  ├─ wellness-supplements → Wellness & Supplements
│  └─ gifts-lifestyle      → Gifts & Lifestyle
│
├─ Books & Media (1 category)
│  └─ books-media          → Books & Media
│
├─ Toys & Games (1 category)
│  └─ toys-games           → Toys & Games
│
├─ Kitchen (2 categories)
│  ├─ kitchen              → Kitchen
│  └─ small-appliances     → Small Appliances
│
└─ Home & Garden (1 category)
   └─ home-garden          → Home & Garden
```

## Type Safety Guarantees

```
CategoryFamilySlug Type
├─ "tech"
├─ "gifts-lifestyle"
├─ "books-media"
├─ "toys-games"
├─ "kitchen"
└─ "home-garden"

CategorySlug Type (17 values)
├─ All slugs must be kebab-case lowercase
├─ URL-safe
└─ Validated at compile-time

CanonicalCategoryLabel Type (17 values)
├─ All labels as they appear in database
├─ Exact case matching required
└─ Used for filtering products

CategoryKey Type (backward compat)
├─ Mirror of CanonicalCategoryLabel
├─ Used by CATEGORY_SYNONYMS
└─ Maintained for existing code
```

## Consistency Validation Test Results

```
Test 1: CATEGORY_TREE Structure
  ✓ 17 total categories
  ✓ 6 unique families
  ✓ 17 unique slugs
  ✓ 17 unique labels
  ✓ No duplicates

Test 2: CATEGORY_SYNONYMS Alignment
  ✓ All 17 keys in CATEGORY_TREE
  ✓ No orphaned keys

Test 3: Slug to Label Mapping
  ✓ All 17 mappings verified
  ✓ No mismatches

Test 4: Expected Coverage
  ✓ All 17 categories found
  ✓ Zero unexpected categories

Test 5: Family Distribution
  ✓ tech: 9
  ✓ gifts-lifestyle: 3
  ✓ books-media: 1
  ✓ toys-games: 1
  ✓ kitchen: 2
  ✓ home-garden: 1
```

## Key Files & Their Roles

```
SOURCE OF TRUTH
├─ src/config/categories.ts
│  └─ Defines all 17 categories with types and CATEGORY_TREE

CONSUMERS
├─ src/app/page.tsx
│  ├─ Imports CATEGORY_KEY_TO_SLUG mapping
│  ├─ Displays 8 tech category pills
│  └─ Sends categorySlug to API
│
├─ src/app/api/products/route.ts
│  ├─ Accepts categorySlug parameter
│  ├─ Maps to CanonicalCategoryLabel
│  └─ Filters products by category
│
├─ src/lib/categoryInference.ts
│  ├─ Infers CanonicalCategoryLabel
│  └─ Updates Product.category in database
│
└─ src/config/categoryFilters.ts (Legacy)
   ├─ Maintains CategoryKey enum
   ├─ Provides CATEGORY_SYNONYMS
   └─ Enables backward compatibility
```

## Migration Path for Existing Code

```
OLD CODE (categoryFilters.ts based):
  CategoryKey = 'Phones' | 'Keyboards & Mouse' | ...
  CATEGORY_SYNONYMS['Phones'] = [...]
  
NEW CODE (categories.ts based):
  CategorySlug = 'phones' | 'keyboards-mice' | ...
  CanonicalCategoryLabel = 'Phones' | 'Keyboards & Mice' | ...
  CATEGORY_TREE = [{slug, label, family}, ...]
  
BACKWARD COMPATIBILITY:
  CategoryKey still available = CanonicalCategoryLabel
  CATEGORY_SYNONYMS unchanged
  Existing code continues to work
```

---

**Status**: ✅ UNIFIED CATEGORY SYSTEM COMPLETE
- All 17 categories from admin audit now integrated
- Single source of truth in categories.ts
- Type-safe throughout application
- All tests passing
- Ready for production
