"use client";

import { useState } from "react";
import { BILINGUAL_ABOUT_CONTENT } from "@/config/aboutContent";

export function FaqToggle() {
  const [open, setOpen] = useState(false);
  const content = BILINGUAL_ABOUT_CONTENT.en; // FAQ is in English only on homepage

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
            {content.faqTitle}
          </h2>
          <div className="space-y-3">
            {content.faqs.map((faq, index) => (
              <div key={index}>
                <p className="font-medium text-slate-900">
                  {faq.question}
                </p>
                <p>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
