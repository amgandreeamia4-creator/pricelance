// src/app/c/headphones-audio/page.tsx
import type { Metadata } from "next";
import CategoryProductGrid from "@/components/CategoryProductGrid";

const category = {
  nameRo: "Căști și audio",
  h1: "Compară prețuri la Căști și Audio",
  descriptionParagraphs: [
    "Compară prețuri la căști in-ear, over-ear, TWS, căști de gaming și boxe portabile din magazinele online din România.",
    "Filtrează ofertele după tipul căștilor, utilizare (muzică, gaming, birou), conexiune (wireless sau cu fir) și brand, ca să găsești rapid cel mai bun raport calitate-preț.",
  ],
};

export const metadata: Metadata = {
  title: `${category.h1} | PriceLance`,
  description: category.descriptionParagraphs[0],
};

export const dynamic = "force-dynamic";

export default function HeadphonesAudioCategoryPage() {
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
        <CategoryProductGrid categoryKey="Headphones & Audio" />
      </section>
    </main>
  );
}
