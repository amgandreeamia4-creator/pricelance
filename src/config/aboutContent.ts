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
  "Coverage is continuously expanding, starting from Romania and gradually extending deeper into the EU.";

// Data sources statement - used in legal/FAQ contexts
export const DATA_SOURCES_STATEMENT =
  "PriceLance combines manually curated product data, official feeds where available, and affiliate feeds from Romanian and European retailers. There is no screen scraping and no bypassing of store rules — only data that stores choose to expose or that we have added manually.";

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
    howTitle: "Cum Funcționează PriceLance",
    faqTitle: "Întrebări Frecvente (FAQ)",
    intro: "PriceLance este o platformă de inteligență de prețuri pentru produse tech.",
    description:
      "Agregă date de produse din intrări manual curate, fluxuri oficiale și parteneri de afiliere pentru a prezenta oferte clare și comparabile din mai multe magazine online într-un singur loc.",
    howToStart:
      "Începe prin a căuta un telefon, laptop sau alt produs tech. PriceLance afișează oferte relevante de la diferiți retaileri, inclusiv prețuri, informații de livrare de bază și linkuri directe către website-ul retailerului.",
    steps: [
      "Caută sau navighează produsele care te interesează.",
      "Sistemul prelucrează și normalizează oferte de la mai multe surse de date.",
      "Compară prețurile, timpii de livrare și informațiile despre magazine într-o vizualizare unificată.",
      "Selectează o opțiune și completează achiziția pe website-ul retailerului.",
    ],
    disclaimer:
      "PriceLance este un serviciu informativ și nu vinde produse direct. Toate achizițiile sunt finalizate pe website-urile retailerilor sub termenii și politicile lor proprii.",
    priceVerification:
      "Verifică întotdeauna prețul final, costurile de livrare și detaliile produsului pe website-ul retailerului înainte de a cumpăra.",
    coverageNote:
      "Acoperirea se extinde continuu, începând din România și extinzându-se treptat mai adânc în UE.",
    dataSources:
      "PriceLance combină date de produse manual curate, fluxuri oficiale de la retaileri unde sunt disponibile și fluxuri de afiliere. Nu există screen scraping și nicio ocolire a regulilor magazinelor — doar date pe care magazinele le expun în mod intenționat sau pe care le-am adăugat manual.",
    affiliateStatement:
      "Unele linkuri pe PriceLance sunt linkuri de afiliere. Dacă cumperi prin unul dintre aceste linkuri, putem câștiga o mică comisie de la retailer, fără costuri suplimentare pentru tine. Aceasta ne ajută să acoperim costurile de funcționare și să îmbunătățim acoperirea. Relațiile de afiliere nu modifică prețurile pe care le vezi sau modul în care sunt afișate ofertele.",
    faqs: [
      {
        question: "Cumpăr produse pe PriceLance?",
        answer:
          "Nu. PriceLance este un instrument de comparație informativă. Când faci clic pe o ofertă, mergi pe website-ul retailerului pentru a finaliza achiziția sub termenii lor proprii.",
      },
      {
        question: "Sunt prețurile întotdeauna 100% exacte?",
        answer:
          "Prețurile și disponibilitatea se pot schimba rapid. Facem tot posibilul pentru a menține datele actuale, dar ar trebui să verifici întotdeauna prețul final și detaliile pe site-ul retailerului înainte de a comanda.",
      },
      {
        question: "De unde obțineți datele?",
        answer:
          "Din intrări manual curate, fluxuri oficiale de retaileri unde sunt disponibile și parteneri de afiliere. Nu ocolim regulile magazinelor și nu facem scraping în zone protejate.",
      },
      {
        question: "Este PriceLance gratuit?",
        answer:
          "Da. PriceLance este gratuit pentru utilizatori. Câștigăm mici comisioane de la unele magazine când cumperi prin linkurile noastre, ceea ce ne ajută să menținem serviciul gratuit.",
      },
      {
        question: "Folosiți linkuri de afiliere?",
        answer:
          "Da. Unele linkuri pot fi de afiliere, ceea ce ne ajută să menținem serviciul fără costuri suplimentare pentru tine.",
      },
    ],
  },
} as const;

// Legacy-compatible export for backwards compatibility with existing modal component
export const HOW_FAQ_COPY = BILINGUAL_ABOUT_CONTENT;
