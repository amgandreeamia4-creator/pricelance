// src/app/c/laptops/page.tsx
import type { Metadata } from "next";
import CategoryProductGrid from "@/components/CategoryProductGrid";

const category = {
  nameRo: "Laptopuri",
  h1: "Compară prețuri la Laptopuri",
  descriptionParagraphs: [
    "Găsește cele mai bune oferte la laptopuri din România. Compară prețuri la notebook-uri gaming, business și ultrabookuri de la magazinele de top.",
    "Vizualizează specificații tehnice, review-uri și alege laptopul potrivit pentru bugetul și nevoile tale. Prețuri actualizate în timp real.",
  ],
};

const canonicalPath = "/c/laptops";

export const metadata: Metadata = {
  title: `${category.h1} – ${category.nameRo} în România | PriceLance`,
  description: category.descriptionParagraphs[0],
  // This will combine with metadataBase from layout.tsx => https://pricelance.com/c/laptops
  alternates: {
    canonical: canonicalPath,
  },
  openGraph: {
    title: `${category.h1} | PriceLance`,
    description: category.descriptionParagraphs[0],
    url: canonicalPath,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${category.h1} | PriceLance`,
    description: category.descriptionParagraphs[0],
  },
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

      <section aria-label={`Produse din categoria ${category.nameRo}`}>
        <CategoryProductGrid categoryKey="Laptops" />
      </section>
    </main>
  );
}