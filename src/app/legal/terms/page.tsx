import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – PriceLance",
  description:
    "Terms of Service for using the PriceLance website. Please read before using the service.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-2">Terms of Service</h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
        Last updated: 2025-12-25
      </p>

      {/* What PriceLance Is */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">What PriceLance Is</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          PriceLance is an informational service that helps you compare prices
          for technology products from multiple online retailers. PriceLance
          does not sell products directly. You always complete purchases on
          retailer websites, under their own terms and conditions.
        </p>
      </section>

      {/* No Guarantee of Accuracy */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">No Guarantee of Accuracy</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          All information on PriceLance is provided on an &quot;as is&quot; and
          &quot;as available&quot; basis. We do our best to keep data accurate
          and up to date, but we cannot guarantee that:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-100 space-y-1 mb-2">
          <li>Prices shown are current or error-free.</li>
          <li>Products are in stock or available at any particular retailer.</li>
          <li>Promotions or discounts are still valid.</li>
          <li>All product details (specs, images, descriptions) are accurate.</li>
        </ul>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          Prices, availability, and promotions can change at any time without
          notice. The retailer&apos;s website is always the authoritative source.
        </p>
      </section>

      {/* Your Responsibilities */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Responsibilities</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          By using PriceLance, you agree to:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-100 space-y-1">
          <li>
            Always verify the final price, delivery cost, and product details
            directly on the retailer&apos;s website before making a purchase.
          </li>
          <li>
            Follow each retailer&apos;s terms and conditions when you buy from them.
          </li>
          <li>
            Not use PriceLance for any unlawful purpose or in any way that could
            harm, disable, or impair the service.
          </li>
          <li>
            Not attempt to scrape, crawl, or extract data from PriceLance
            through automated means without permission.
          </li>
        </ul>
      </section>

      {/* Data Sources and Scraping */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Sources and Scraping</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          PriceLance gathers price and product information from a combination
          of: manually curated data, CSV imports, official retailer feeds where
          available, and affiliate feeds. We do not intentionally scrape
          retailer websites or bypass any access controls. We only use data that
          retailers choose to expose publicly or that we add manually.
        </p>
      </section>

      {/* Affiliate Links */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Affiliate Links</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          Some links on PriceLance are affiliate links. If you click on one of
          these links and make a purchase, we may receive a small commission
          from the retailer or affiliate network, at no extra cost to you.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          Affiliate relationships do not change the prices you see or how offers
          are ranked or displayed. Retailers do not control which products
          appear or how they are ordered.
        </p>
      </section>

      {/* Limitation of Liability */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          To the maximum extent permitted by applicable law, PriceLance and its
          operators shall not be liable for any direct, indirect, incidental,
          special, consequential, or punitive damages arising out of or related
          to:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-100 space-y-1 mb-2">
          <li>Your use of (or inability to use) the service.</li>
          <li>
            Any inaccuracies, errors, or omissions in the information provided.
          </li>
          <li>
            Any actions you take based on the information shown on PriceLance.
          </li>
          <li>
            Any transactions you complete on third-party retailer websites.
          </li>
        </ul>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          You use PriceLance entirely at your own risk.
        </p>
      </section>

      {/* Changes to the Service and These Terms */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Changes to the Service and These Terms
        </h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          We may modify, suspend, or discontinue any part of PriceLance at any
          time, without notice. We may also update these Terms of Service from
          time to time. Continued use of the service after changes are posted
          constitutes acceptance of the updated terms.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          If you have questions about these Terms of Service, you can contact us
          at{" "}
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
