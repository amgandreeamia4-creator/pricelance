import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy  PriceLance",
  description: "Privacy practices for visitors using PriceLance.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">Privacy Policy</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Overview</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          PriceLance is designed to be usable without creating an account or
          logging in. You can browse products and compare prices without
          providing personal details.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          This privacy policy explains, in simple terms, what information may
          be collected when you use the site and how it is used.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Analytics and Usage Data</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          To understand how the site is used and to improve the product, we
          may collect basic analytics such as page views, search queries, and
          general usage patterns. This information is typically aggregated and
          does not include sensitive personal data.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          Analytics are used solely to make PriceLance better: to improve
          performance, understand which features are useful, and identify where
          the experience can be improved.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Personal Data and Contact</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          In normal use, you are not required to provide personal information.
          If you choose to contact us (for example, by email), we may store
          the information you send in order to respond and keep basic records
          of the communication.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          We do not sell personal data to third parties. Any personal
          information that is collected is used only for operating and
          improving PriceLance or for responding to your requests.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          If you have questions about this policy or want to request the
          removal of contact information you previously provided, you can reach
          out at <a href="mailto:contact@example.com" className="underline">contact@example.com</a>.
        </p>
      </section>
    </main>
  );
}
