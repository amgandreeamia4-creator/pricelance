// src/lib/categories.ts
// Central configuration for categories and subcategories

import type { CategoryKey } from '@/config/categoryFilters';

export type SubcategoryKey =
  | "shampoo"
  | "conditioner"
  | "hair-dye"
  | "hair-treatment"
  | "hair-styling"
  | "lip-balm"
  | "toothpaste"
  | "body-cream"
  | "personal-other"
  | "honey"
  | "throat-spray"
  | "vitamin-supplement"
  | "general-supplement"
  | "wellness-other";

export const SUBCATEGORY_KEYWORDS: {
  [category in CategoryKey]?: { subcategory: SubcategoryKey; keywords: string[] }[];
} = {
  // Personal Care subcategories
  "Personal Care": [
    {
      subcategory: "shampoo",
      keywords: ["sampon", "șampon", "shampoo"],
    },
    {
      subcategory: "conditioner",
      keywords: ["balsam pentru par", "balsam de par", "conditioner"],
    },
    {
      subcategory: "hair-dye",
      keywords: ["vopsea", "vopsea crema", "vopsea par", "hair dye", "colorant"],
    },
    {
      subcategory: "hair-treatment",
      keywords: [
        "tratament par",
        "masca de par",
        "hair mask",
        "hair treatment",
        "ulei de par",
        "hair oil",
        "ser pentru par",
        "hair serum",
      ],
    },
    {
      subcategory: "hair-styling",
      keywords: [
        "spray fixativ",
        "fixativ",
        "spray texturizant",
        "mousse",
        "spuma de par",
        "gel de par",
        "hair spray",
        "styling",
      ],
    },
    {
      subcategory: "lip-balm",
      keywords: ["balsam de buze", "balsam pentru buze", "lip balm"],
    },
    {
      subcategory: "toothpaste",
      keywords: ["pasta de dinti", "pastă de dinți", "toothpaste"],
    },
    {
      subcategory: "body-cream",
      keywords: [
        "crema de corp",
        "cremă de corp",
        "body lotion",
        "body cream",
        "crema pentru corp",
      ],
    },
  ],

  // Wellness & Supplements subcategories
  "Wellness & Supplements": [
    {
      subcategory: "honey",
      keywords: ["miere", "miere de manuka", "manuka", "honey"],
    },
    {
      subcategory: "throat-spray",
      keywords: [
        "spray pentru gat",
        "spray pentru gât",
        "spray oral",
        "spray bucal",
        "throat spray",
        "oral spray",
      ],
    },
    {
      subcategory: "vitamin-supplement",
      keywords: ["vitamina", "vitamine", "vitamin", "vitamins"],
    },
    {
      subcategory: "general-supplement",
      keywords: ["supliment", "suplimente", "supplement", "capsule", "pastile"],
    },
  ],
};
