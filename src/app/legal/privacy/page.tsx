import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – PriceLance",
  description:
    "Privacy practices for visitors using PriceLance. Learn what information we collect and how we use it.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
        Last updated: 2025-12-25
      </p>

      {/* Who Operates PriceLance */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Who Operates PriceLance</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          PriceLance is an informational service that helps you compare prices
          for technology products from multiple online retailers. This Privacy
          Policy explains what information we collect when you use PriceLance
          and how we use it.
        </p>
      </section>

      {/* Information We Collect */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>

        {/* a) Technical and usage data */}
        <h3 className="text-base font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-50">
          a) Technical and usage data
        </h3>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          When you visit PriceLance, we may automatically collect certain
          technical information, including:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-100 space-y-1 mb-2">
          <li>
            Your IP address (which may be anonymized or aggregated for analytics).
          </li>
          <li>Browser type and version.</li>
          <li>Device type and operating system.</li>
          <li>Pages you visit, search queries you enter, and general usage patterns.</li>
          <li>Referring website (the page that linked you to PriceLance).</li>
        </ul>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          This data is used to understand how the site is used, to improve
          performance, and to identify where the experience can be improved. We
          do not use this data to personally identify you.
        </p>

        {/* b) Data you actively provide */}
        <h3 className="text-base font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-50">
          b) Data you actively provide
        </h3>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          PriceLance is designed to be usable without creating an account or
          logging in. In normal use, you are not required to provide personal
          information. If you choose to contact us (for example, by email), we
          may store the information you send in order to respond and keep basic
          records of the communication.
        </p>
      </section>

      {/* How We Use the Information */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">How We Use the Information</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          We use the information we collect to:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-100 space-y-1">
          <li>Operate and maintain the PriceLance service.</li>
          <li>Improve the site, fix bugs, and develop new features.</li>
          <li>
            Understand which products and features are most useful to visitors.
          </li>
          <li>Respond to questions or feedback you send us.</li>
        </ul>
      </section>

      {/* Cookies and Local Storage */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Cookies and Local Storage</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          PriceLance may use cookies or local storage to:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-100 space-y-1 mb-2">
          <li>Remember your preferences (such as theme or location settings).</li>
          <li>Store your list of favorite products locally.</li>
          <li>Collect anonymous analytics data.</li>
        </ul>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          You can control or disable cookies through your browser settings, but
          some features may not work as expected if you do so.
        </p>
      </section>

      {/* Third-Party Services */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Third-Party Services</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
          We may use third-party services for analytics, hosting, or other
          operational purposes. These services may collect data according to
          their own privacy policies.
        </p>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          When you click on an affiliate link, your browser may be redirected
          through an affiliate network before arriving at the retailer&apos;s
          website. Non-personal identifiers (such as a campaign ID or click
          reference) may be included in the URL so that the affiliate network
          can attribute any resulting purchases. These tracking parameters are
          not used by PriceLance to identify you personally. The data collected
          on the retailer&apos;s side is governed by the retailer&apos;s and affiliate
          network&apos;s own privacy policies.
        </p>
      </section>

      {/* Links to Other Sites */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Links to Other Sites</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          PriceLance contains links to retailer websites and other third-party
          sites. We are not responsible for the privacy practices or content of
          those sites. We encourage you to review the privacy policies of any
          site you visit.
        </p>
      </section>

      {/* Data Retention */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Retention</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          We retain technical and usage data only as long as necessary to
          fulfill the purposes described in this policy, or as required by law.
          Aggregated or anonymized data that cannot be used to identify you may
          be retained indefinitely for analytical purposes.
        </p>
      </section>

      {/* Your Choices */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Choices</h2>
        <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-100 space-y-1">
          <li>
            You can use PriceLance without providing personal information.
          </li>
          <li>
            You can disable cookies or clear local storage through your browser
            settings.
          </li>
          <li>
            If you prefer not to use affiliate links, you may navigate to the
            retailer&apos;s website directly.
          </li>
          <li>
            If you have contacted us and want your information removed, you can
            request this by emailing us.
          </li>
        </ul>
      </section>

      {/* Changes to This Policy */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Changes to This Policy</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          We may update this Privacy Policy from time to time. When we do, we
          will revise the &quot;Last updated&quot; date at the top of this page.
          Continued use of the service after changes are posted constitutes
          acceptance of the updated policy.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p className="text-sm text-gray-800 dark:text-gray-100">
          If you have questions about this Privacy Policy or want to request
          the removal of contact information you previously provided, you can
          reach us at{" "}
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
