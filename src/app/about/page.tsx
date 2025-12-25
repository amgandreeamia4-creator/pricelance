import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About PriceLance – Tech Price Comparison That Keeps Expanding",
  description:
    "PriceLance is an informational service that helps you compare prices for technology products from multiple online retailers. Coverage is constantly growing.",
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">
        About PriceLance
      </h1>

      <p className="mb-4 text-sm text-gray-800 dark:text-gray-100">
        PriceLance is an informational service that helps you compare prices for
        technology products from multiple online retailers. PriceLance does not
        sell products directly; you always complete purchases on retailer
        websites under their terms. The catalog and store coverage are
        constantly growing.
      </p>

      {/* How PriceLance Works */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-5">How PriceLance Works</h2>

        {/* Block 1 - Data sources */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">
            1. We gather prices from trusted sources
          </h3>
          <p className="text-sm text-gray-800 dark:text-gray-100">
            PriceLance combines manually curated product data, official feeds
            where available, and affiliate feeds from Romanian and European
            retailers. There is no screen scraping and no bypassing of store
            rules — only data that stores choose to expose or that we have added
            manually.
          </p>
        </div>

        {/* Block 2 - Clean comparison view */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">
            2. We show you a clean comparison
          </h3>
          <p className="text-sm text-gray-800 dark:text-gray-100">
            For each product, you see offers from multiple stores side by side:
            price, currency, store name, and basic delivery hints when
            available. You can sort by price, filter by store, and focus on
            faster delivery options when that information exists in the data.
          </p>
        </div>

        {/* Block 3 - You choose where to buy */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">
            3. You pick the store and double-check details
          </h3>
          <p className="text-sm text-gray-800 dark:text-gray-100">
            When you click an offer, you go directly to the retailer&apos;s
            website. Prices, availability, and promotions can change fast, so
            always verify the final price, delivery cost, and product details on
            the store page before you complete your order.
          </p>
        </div>

        {/* Block 4 - Coverage / growth */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">
            Coverage that&apos;s continuously expanding
          </h3>
          <p className="text-sm text-gray-800 dark:text-gray-100">
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
        <p className="mb-3 text-sm text-gray-800 dark:text-gray-100">
          Some links on PriceLance are affiliate links. If you buy through one
          of these links, we may earn a small commission from the retailer, at
          no extra cost to you. This helps cover the costs of running the
          service and improving coverage. Affiliate relationships do not change
          the prices you see or the way offers are displayed.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          Retailers do not control which products appear or how they are ranked.
        </p>
      </section>

      {/* Feedback */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Feedback</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
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
