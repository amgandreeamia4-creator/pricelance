import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – PriceLance",
  description: "Terms of Service for using the PriceLance website.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">Terms of Service</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Use of the Service</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          PriceLance is provided as an informational tool to help you compare
          prices for technology products, primarily in Romania. The service is
          offered on an &quot;as is&quot; and &quot;as available&quot; basis, without any
          guarantees about accuracy, completeness, or availability.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          You are responsible for how you use the information shown in
          PriceLance. Nothing on this site should be considered financial,
          legal, or professional advice. We do not guarantee that any
          particular product will be available, that a promotion will still be
          valid, or that prices will remain unchanged.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Sources</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          Price information and product details are collected from a
          combination of manually curated data and official feeds where
          available. We do not rely on unauthorized scraping of retailer
          websites. However, even with care, mistakes and delays can occur.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          Before making any purchase, you must always verify the final price,
          delivery conditions, and product details directly on the retailer&apos;s
          website. The retailer&apos;s information always prevails over what you
          see on PriceLance.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Affiliate Links</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          Some links on PriceLance may be affiliate links. This means that
          if you click on a link to a retailer and make a purchase, we may
          receive a commission or other benefit from that retailer or from
          an affiliate network. This does not change the price you pay, nor
          does it affect how we display or rank offers in the comparison
          view.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          We aim to present offers fairly and transparently regardless of
          whether an affiliate relationship exists. You are free to ignore
          affiliate links and purchase through any channel you prefer.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          While we aim to keep information reasonably accurate and up to date,
          we cannot guarantee that all data is correct at all times. Prices,
          availability, and promotions may change without notice, and there may
          be errors or omissions.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          To the maximum extent permitted by law, PriceLance and its
          maintainers are not liable for any direct, indirect, incidental, or
          consequential damages arising from your use of the site or reliance
          on the information it provides. You use the service entirely at your
          own risk.
        </p>
      </section>
    </main>
  );
}
