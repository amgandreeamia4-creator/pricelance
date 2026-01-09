// src/app/c/monitors/page.tsx
import type { Metadata } from "next";
import CategoryProductGrid from "@/components/CategoryProductGrid";

const category = {
  nameRo: "Monitoare",
  h1: "Compară prețuri la Monitoare",
  descriptionParagraphs: [
    "Găsește monitorul potrivit pentru birou, gaming sau editare foto-video. Compară prețuri la monitoare Full HD, 2K, 4K și ultrawide de la magazinele de top din România.",
    "Filtrează după dimensiune, rată de refresh, tipul panoului și brand pentru a vedea rapid unde găsești cea mai bună ofertă pentru următorul tău monitor.",
  ],
};

export const metadata: Metadata = {
  title: `${category.h1} | PriceLance`,
  description: category.descriptionParagraphs[0],
};

// Keep this aligned with other category pages so we always hit fresh data.
export const dynamic = "force-dynamic";

export default function MonitorsCategoryPage() {
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

      <section aria-label={`Produse din categoria ${category.nameRo}`}>
        <CategoryProductGrid categoryKey="Monitors" />
      </section>
    </main>
  );
}
