// src/app/c/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import CategoryProductGrid from "./CategoryProductGrid";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  // Next 16 PageProps expects params to be a Promise
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: CategoryPageProps
): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Unknown category | PriceLance",
      description: "The requested category could not be found on PriceLance.",
    };
  }

  return {
    title: `${category.h1} | PriceLance`,
    description: category.descriptionParagraphs[0],
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
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

      <section aria-label={`Products in the ${category.nameRo} category`}>
        <CategoryProductGrid categoryKey={category.categoryKey} />
      </section>
    </main>
  );
}