"use client";

import { useState } from "react";

export function FaqToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        {open ? "Hide FAQ" : "Show FAQ"}
      </button>

      {open && (
        <div className="mt-4 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-2">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-slate-900">
                Do I buy products on PriceLance?
              </p>
              <p>
                No. PriceLance is an informational comparison tool. When you click an
                offer, you go to the retailer&apos;s website to complete your purchase
                under their own terms.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">
                Are the prices always 100% accurate?
              </p>
              <p>
                Prices and availability can change quickly. We do our best to keep data
                fresh, but you should always double-check the final price and details on
                the retailer&apos;s site before ordering.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">
                Where do you get your data from?
              </p>
              <p>
                From manually curated entries, CSV imports, official retailer feeds where
                available, and affiliate partners. We don&apos;t bypass store rules or
                scrape protected areas.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">
                How can I report an incorrect price?
              </p>
              <p>
                You can email us at{" "}
                <a
                  href="mailto:support@pricelance.com"
                  className="text-blue-600 hover:underline"
                >
                  support@pricelance.com
                </a>{" "}
                with the product link and a short note. Real-world feedback helps decide
                what we improve next.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
