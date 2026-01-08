// src/app/c/[slug]/page.tsx
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/categories";
import CategoryProductGrid from "./CategoryProductGrid";

export const dynamic = "force-dynamic";

type CategoryPageParams = {
  params: {
    slug: string;
  };
};

export async function generateMetadata(
  { params }: CategoryPageParams
): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug);

  if (!category) {
    return {
      title: "Categoria nu a fost găsită | PriceLance",
      description: `Nu am găsit o categorie pentru „${params.slug ?? ""}”. Folosește căutarea pentru a explora produsele.`,
    };
  }

  return {
    title: `${category.h1} | PriceLance`,
    description: category.descriptionParagraphs[0],
  };
}

export default function CategoryPage({ params }: CategoryPageParams) {
  const category = getCategoryBySlug(params.slug);

  if (!category) {
    const slug = params.slug ?? "";

    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold md:text-3xl">
          Categoria nu a fost găsită
        </h1>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Nu am găsit o categorie pentru „{slug || "…"}”. Te rugăm să revii la
          pagina principală sau să folosești căutarea.
        </p>
      </main>
    );
  }

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
        <CategoryProductGrid categoryKey={category.categoryKey} />
      </section>
    </main>
  );
}