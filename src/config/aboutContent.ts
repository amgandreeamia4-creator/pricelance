/**
 * Canonical source of truth for About / informational content
 * 
 * All About, disclaimer, coverage, and informational messaging throughout the app
 * should be imported from this file to ensure consistency, reduce duplication,
 * and maintain a single source of truth for typography and messaging.
 */

export const ABOUT_TITLE = "PriceLance";

export const ABOUT_INTRO =
  "PriceLance is a structured price intelligence system for tech products.";

export const ABOUT_DESCRIPTION =
  "It aggregates product data from curated manual entries, official feeds, and affiliate partners to present clear, comparable offers from multiple online stores in one place.";

export const ABOUT_HOW_TO_START =
  "Start by searching for a phone, laptop, or another tech product. PriceLance surfaces relevant offers from different retailers, including pricing, basic delivery information, and direct links to the retailer's website.";

// Main "How it works" steps displayed in multiple places
export const HOW_IT_WORKS_STEPS = [
  "Search or browse the products you're interested in.",
  "The system retrieves and normalizes offers from multiple data sources.",
  "Compare prices, delivery times, and store information in a unified view.",
  "Select an option and complete your purchase on the retailer's website.",
];

// Primary disclaimer: what PriceLance is and is not
export const ABOUT_DISCLAIMER =
  "PriceLance is an informational service and does not sell products directly. All purchases are completed on retailer websites under their own terms and policies.";

// Secondary disclaimer: price verification
export const ABOUT_PRICE_VERIFICATION =
  "Always verify the final price, delivery costs, and product details on the retailer's website before buying.";

// Coverage information
export const ABOUT_COVERAGE_NOTE =
  "Coverage is continuously expanding as new products, categories, and retailers are added over time.";

// Data sources statement - used in legal/FAQ contexts
export const DATA_SOURCES_STATEMENT =
  "PriceLance combines manually curated product data, official feeds where available, and affiliate feeds from participating retailers. There is no screen scraping and no bypassing of store rules — only data that stores choose to expose or that we have added manually.";

// Affiliate links statement
export const AFFILIATE_STATEMENT =
  "Some links on PriceLance are affiliate links. If you buy through one of these links, we may earn a small commission from the retailer, at no extra cost to you. This helps cover the costs of running the service and improving coverage. Affiliate relationships do not change the prices you see or the way offers are displayed.";

// Short tagline for headers/metadata
export const ABOUT_SHORT_DESCRIPTION =
  "PriceLance is an informational service that helps you compare prices for technology products from multiple online retailers.";

// Bilingual content for modals and components that support multiple languages
export const BILINGUAL_ABOUT_CONTENT = {
  en: {
    howTitle: "How PriceLance Works",
    faqTitle: "Frequently Asked Questions (FAQ)",
    intro: ABOUT_INTRO,
    description: ABOUT_DESCRIPTION,
    howToStart: ABOUT_HOW_TO_START,
    steps: HOW_IT_WORKS_STEPS,
    disclaimer: ABOUT_DISCLAIMER,
    priceVerification: ABOUT_PRICE_VERIFICATION,
    coverageNote: ABOUT_COVERAGE_NOTE,
    dataSources: DATA_SOURCES_STATEMENT,
    affiliateStatement: AFFILIATE_STATEMENT,
    faqs: [
      {
        question: "Do I buy products on PriceLance?",
        answer:
          "No. PriceLance is an informational comparison tool. When you click an offer, you go to the retailer's website to complete your purchase under their own terms.",
      },
      {
        question: "Are the prices always 100% accurate?",
        answer:
          "Prices and availability can change quickly. We do our best to keep data fresh, but you should always double-check the final price and details on the retailer's site before ordering.",
      },
      {
        question: "Where do you get your data from?",
        answer:
          "From manually curated entries, official retailer feeds where available, and affiliate partners. We don't bypass store rules or scrape protected areas.",
      },
      {
        question: "Is PriceLance free to use?",
        answer:
          "Yes. PriceLance is free for users. We earn small commissions from some stores when you buy through our links, which helps us keep the service free.",
      },
      {
        question: "Do you use affiliate links?",
        answer:
          "Yes. Some links may be affiliate links, which helps us maintain the service at no extra cost to you.",
      },
    ],
  },
  ro: {
    howTitle: "How PriceLance Works",
    faqTitle: "Frequently Asked Questions (FAQ)",
    intro: ABOUT_INTRO,
    description: ABOUT_DESCRIPTION,
    howToStart: ABOUT_HOW_TO_START,
    steps: HOW_IT_WORKS_STEPS,
    disclaimer: ABOUT_DISCLAIMER,
    priceVerification: ABOUT_PRICE_VERIFICATION,
    coverageNote: ABOUT_COVERAGE_NOTE,
    dataSources: DATA_SOURCES_STATEMENT,
    affiliateStatement: AFFILIATE_STATEMENT,
    faqs: [
      {
        question: "Do I buy products on PriceLance?",
        answer:
          "No. PriceLance is an informational comparison tool. When you click an offer, you go to the retailer's website to complete your purchase under their own terms.",
      },
      {
        question: "Are the prices always 100% accurate?",
        answer:
          "Prices and availability can change quickly. We do our best to keep data fresh, but you should always double-check the final price and details on the retailer's site before ordering.",
      },
      {
        question: "Where do you get your data from?",
        answer:
          "From manually curated entries, official retailer feeds where available, and affiliate partners. We don't bypass store rules or scrape protected areas.",
      },
      {
        question: "Is PriceLance free to use?",
        answer:
          "Yes. PriceLance is free for users. We earn small commissions from some stores when you buy through our links, which helps us keep the service free.",
      },
      {
        question: "Do you use affiliate links?",
        answer:
          "Yes. Some links may be affiliate links, which helps us maintain the service at no extra cost to you.",
      },
    ],
  },
} as const;

// Legacy-compatible export for backwards compatibility with existing modal component
export const HOW_FAQ_COPY = BILINGUAL_ABOUT_CONTENT;
