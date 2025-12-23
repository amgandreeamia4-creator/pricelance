import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About PriceLance",
  description: "PriceLance is an early-stage price comparison app for tech in Romania.",
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">About PriceLance</h1>

      <p className="mb-4 text-sm text-gray-800 dark:text-gray-100">
        PriceLance is a small indie project exploring how to make real price
        comparison for technology products in Romania more transparent and
        useful. The focus is on everyday tech like phones, laptops, monitors,
        and related accessories.
      </p>

      <p className="mb-4 text-sm text-gray-800 dark:text-gray-100">
        The prices you see in PriceLance come from a mix of manually curated
        data and official feeds from Romanian retailers. We do not scrape
        stores or bypass their official channels. Instead, the goal is to
        combine trustworthy sources into a single, clear view of the market.
      </p>

      <p className="mb-4 text-sm text-gray-800 dark:text-gray-100">
        PriceLance is still a work in progress. The catalog is limited and
        the data set is evolving as we experiment with different ways of
        importing and updating prices. Features and design may change over
        time as the project matures.
      </p>

      <p className="mb-4 text-sm text-gray-800 dark:text-gray-100">
        Prices, availability, and promotions can change quickly. The
        information shown in PriceLance is provided for convenience only and
        may not always reflect the latest price or stock status. Before you
        make a purchase, please always double-check the final price, delivery
        cost, and product details directly on the retailer&apos;s website.
      </p>

      <p className="mb-4 text-sm text-gray-800 dark:text-gray-100">
        If you have feedback, find incorrect data, or want to suggest new
        features, you are very welcome to get in touch. This is an
        early-stage project and real-world feedback is extremely valuable.
      </p>
    </main>
  );
}
