import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact PriceLance",
  description: "How to contact the PriceLance team for questions or feedback.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Contact PriceLance
        </h1>
        <p className="text-slate-700 dark:text-slate-300 mb-4">
          If you have questions, feedback, or want to report an issue with the data shown
          on PriceLance, we&apos;d be happy to hear from you — use the form below or email us.
        </p>

        <ContactForm />
      </div>
    </main>
  );
}
