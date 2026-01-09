// src/app/c/phones/page.tsx
import type { Metadata } from "next";
import CategoryProductGrid from "@/components/CategoryProductGrid";

const category = {
  nameRo: "Telefoane",
  h1: "Compară prețuri la Telefoane mobile",
  descriptionParagraphs: [
    "Compară prețuri la telefoane mobile în România. Găsește oferte la smartphone-uri Android, iPhone și modele accesibile pentru orice buget.",
    "Filtrează după brand, magazin și buget și vezi rapid unde găsești cel mai bun preț pentru următorul tău telefon.",
  ],
};

export const metadata: Metadata = {
  title: `${category.h1} | PriceLance`,
  description: category.descriptionParagraphs[0],
};

export const dynamic = "force-dynamic";

export default function PhonesCategoryPage() {
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
        <CategoryProductGrid categoryKey="Phones" />
      </section>
    </main>
  );
}