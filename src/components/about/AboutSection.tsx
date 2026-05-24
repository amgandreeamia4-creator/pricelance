/**
 * AboutSection Component
 * 
 * Canonical UI component for rendering About / informational content.
 * 
 * This is the ONLY place where About content is rendered across the app.
 * All content is imported from src/config/aboutContent.ts (single source of truth).
 * 
 * All typography is enforced here:
 * - Title: text-xl font-semibold
 * - Body: text-base leading-relaxed
 * - Section headings: text-lg font-medium
 * - Disclaimer: text-sm text-gray-500 only
 * 
 * DO NOT render About content elsewhere. Use this component instead.
 */

import React from "react";
import {
  ABOUT_TITLE,
  ABOUT_INTRO,
  ABOUT_DESCRIPTION,
  ABOUT_HOW_TO_START,
  HOW_IT_WORKS_STEPS,
  ABOUT_DISCLAIMER,
  ABOUT_PRICE_VERIFICATION,
  ABOUT_COVERAGE_NOTE,
  DATA_SOURCES_STATEMENT,
  AFFILIATE_STATEMENT,
} from "@/config/aboutContent";

export type AboutSectionVariant =
  | "full" // Full page layout
  | "disclaimer" // Disclaimer only
  | "intro" // Brief intro + disclaimer
  | "footer"; // Footer snippet

interface AboutSectionProps {
  variant?: AboutSectionVariant;
  className?: string;
}

/**
 * Renders the About section with enforced typography and layout.
 * 
 * @param variant - Which section to render ('full', 'disclaimer', 'intro', 'footer')
 * @param className - Additional CSS classes to apply to the root element
 */
export function AboutSection({
  variant = "full",
  className = "",
}: AboutSectionProps) {
  // FULL PAGE LAYOUT
  if (variant === "full") {
    return (
      <main className={`max-w-3xl mx-auto px-4 py-10 ${className}`}>
        <h1 className="text-3xl font-semibold mb-6">
          About PriceLance
        </h1>

        {/* Introduction */}
        <section className="mt-6 space-y-4 text-slate-700 dark:text-slate-200/90 text-base leading-relaxed">
          <p>
            {ABOUT_INTRO} {ABOUT_DESCRIPTION}
          </p>
          <p>
            {ABOUT_HOW_TO_START}
          </p>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            {ABOUT_COVERAGE_NOTE} {ABOUT_PRICE_VERIFICATION}
          </p>
        </section>

        {/* Canonical disclaimer - single source */}
        <p className="mb-6 text-base text-slate-700 dark:text-slate-200 leading-relaxed">
          {ABOUT_DISCLAIMER}
        </p>

        {/* How PriceLance Works */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-5">
            How PriceLance Works
          </h2>

          {/* Step 1 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 text-slate-800 dark:text-slate-100">
              1. {HOW_IT_WORKS_STEPS[0]}
            </h3>
            <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
              {DATA_SOURCES_STATEMENT}
            </p>
          </div>

          {/* Step 2 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 text-slate-800 dark:text-slate-100">
              2. {HOW_IT_WORKS_STEPS[1]}
            </h3>
            <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
              For each product, you see offers from multiple stores side by side:
              price, currency, store name, and basic delivery hints when
              available. You can sort by price, filter by store, and focus on
              faster delivery options when that information exists in the data.
            </p>
          </div>

          {/* Step 3 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 text-slate-800 dark:text-slate-100">
              3. {HOW_IT_WORKS_STEPS[2]}
            </h3>
            <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
              When you click an offer, you go directly to the retailer&apos;s
              website. {ABOUT_PRICE_VERIFICATION}
            </p>
          </div>

          {/* Step 4 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 text-slate-800 dark:text-slate-100">
              4. {HOW_IT_WORKS_STEPS[3]}
            </h3>
            <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
              PriceLance started with a curated core of tech products and is
              steadily expanding its coverage. New products, categories, and
              stores are added over time, guided by real searches and feedback.
              The goal is simple: make tech price comparison more transparent and
              useful, starting from Romania and then extending deeper into the EU.
            </p>
          </div>
        </section>

        {/* Affiliate Note */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Affiliate Links</h2>
          <p className="mb-3 text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            {AFFILIATE_STATEMENT}
          </p>
          <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            Retailers do not control which products appear or how they are ranked.
          </p>
        </section>

        {/* Feedback */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Feedback</h2>
          <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            If you notice incorrect data, missing products, or have ideas for what
            would make PriceLance more useful, feedback is welcome. Real-world use
            is what helps shape what gets improved next. You can reach us at{" "}
            <a
              href="mailto:support@pricelance.com"
              className="underline hover:text-blue-600 dark:hover:text-blue-400"
            >
              support@pricelance.com
            </a>
            .
          </p>
        </section>
      </main>
    );
  }

  // DISCLAIMER ONLY
  if (variant === "disclaimer") {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {ABOUT_DISCLAIMER}
      </p>
    );
  }

  // BRIEF INTRO + DISCLAIMER
  if (variant === "intro") {
    return (
      <section className={`space-y-4 ${className}`}>
        <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
          {ABOUT_INTRO} {ABOUT_DESCRIPTION}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {ABOUT_DISCLAIMER}
        </p>
      </section>
    );
  }

  // FOOTER SNIPPET
  if (variant === "footer") {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {ABOUT_INTRO} {AFFILIATE_STATEMENT}
      </p>
    );
  }

  // Fallback
  return null;
}

export default AboutSection;
