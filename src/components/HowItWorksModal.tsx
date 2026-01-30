"use client";

import React, { useState } from "react";

const HOW_FAQ_COPY = {
  en: {
    howTitle: "How PriceLance Works",
    steps: [
      "Search or browse for products you're interested in.",
      "We scan multiple stores and partners to find real-time offers.",
      "Compare prices, delivery times, and store ratings.",
      "Choose the best deal and buy directly from the store.",
    ],
    faqTitle: "Frequently Asked Questions (FAQ)",
    faqs: [
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
      {
        question: "Why are there multiple offers for the same product?",
        answer:
          "We show offers from multiple stores so you can compare prices, delivery conditions, and choose the best option.",
      },
    ],
  },
  ro: {
    howTitle: "Cum Funcționează PriceLance",
    steps: [
      "Caută sau navighează produsele care te interesează.",
      "Scanăm multiple magazine și parteneri pentru a găsi oferte în timp real.",
      "Compară prețurile, timpii de livrare și ratingurile magazinelor.",
      "Alege cea mai bună ofertă și cumpără direct de la magazin.",
    ],
    faqTitle: "Întrebări Frecvente (FAQ)",
    faqs: [
      {
        question: "Este PriceLance gratuit?",
        answer:
          "Da. PriceLance este gratuit pentru utilizatori. Câștigăm comisioane mici de la unele magazine când cumperi prin linkurile noastre, ceea ce ne ajută să menținem serviciul gratuit.",
      },
      {
        question: "Folosiți linkuri de afiliere?",
        answer:
          "Da. Unele linkuri pot fi de afiliere, ceea ce ne ajută să menținem serviciul gratuit fără costuri suplimentare pentru tine.",
      },
      {
        question: "De ce sunt mai multe oferte pentru același produs?",
        answer:
          "Afișăm oferte de la mai multe magazine ca să poți compara prețurile, condițiile de livrare și să alegi cea mai bună variantă.",
      },
    ],
  },
} as const;

interface HowItWorksModalProps {
  children: React.ReactNode;
}

export default function HowItWorksModal({ children }: HowItWorksModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const content = HOW_FAQ_COPY.en;

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  // Handle ESC key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <div onClick={openModal} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-[var(--pl-card)] border border-[var(--pl-card-border)] shadow-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--pl-card-border)] bg-[var(--pl-card)]">
          <h2 className="text-lg font-semibold text-[var(--pl-text)]">
            {content.howTitle}
          </h2>
          <button
            onClick={closeModal}
            className="rounded-lg p-2 text-[var(--pl-muted)] hover:bg-[var(--pl-muted)]/20 hover:text-[var(--pl-text)] transition-colors"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          {/* How it works steps */}
          <section>
            <h3 className="text-base font-medium text-[var(--pl-text)] mb-4">
              How it works
            </h3>
            <ol className="space-y-3">
              {content.steps.map((step, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm text-[var(--pl-muted-foreground)] leading-relaxed"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* FAQ section */}
          <section>
            <h3 className="text-base font-medium text-[var(--pl-text)] mb-4">
              {content.faqTitle}
            </h3>
            <div className="space-y-4">
              {content.faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-[var(--pl-card-border)] last:border-0 pb-4 last:pb-0"
                >
                  <h4 className="text-sm font-medium text-[var(--pl-text)] mb-2">
                    {faq.question}
                  </h4>
                  <p className="text-sm text-[var(--pl-muted-foreground)] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
