// src/app/c/laptops/page.tsx
import type { Metadata } from "next";
import CategoryProductGrid from "@/components/CategoryProductGrid";

const category = {
  nameRo: "Laptops",
  h1: "Compare laptop prices",
  descriptionParagraphs: [
    "Find current offers on laptops from leading retailers and compare gaming, business, and ultrabook options in one place.",
    "Review key specifications and choose the right device for your budget and needs.",
  ],
};

export const metadata: Metadata = {
  title: `${category.h1} | PriceLance`,
  description: category.descriptionParagraphs[0],
};

export const dynamic = "force-dynamic";

export default function LaptopsCategoryPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold md:text-3xl">
          {category.h1}
        </h1>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200 md:text-base">
          {category.descriptionParagraphs.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </header>

      <section aria-label={`Products in the ${category.nameRo} category`}>
        <CategoryProductGrid categoryKey="Laptops" />
      </section>
    </main>
  );
}
