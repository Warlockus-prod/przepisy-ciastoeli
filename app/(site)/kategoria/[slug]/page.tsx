import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ListingHeader } from '@/components/recipe/ListingHeader';
import { RecipeListing } from '@/components/recipe/RecipeListing';
import { listAllCategorySlugs, getCategoryBySlug } from '@/lib/db/queries/taxonomy';
import { listRecipes } from '@/lib/db/queries/recipes';

export const revalidate = 300;

const PER_PAGE = 24;

export async function generateStaticParams() {
  const slugs = await listAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  return {
    title: cat.meta_title ?? `${cat.name_pl} — przepisy`,
    description: cat.meta_description ?? cat.description ?? `Przepisy z kategorii ${cat.name_pl}.`,
    alternates: { canonical: `/kategoria/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const recipes = await listRecipes({
    categorySlug: slug,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ListingHeader
        eyebrow="Kategoria"
        title={cat.name_pl}
        description={cat.description}
        breadcrumbs={[
          { name: 'Strona główna', url: '/' },
          { name: 'Przepisy', url: '/przepisy' },
          { name: cat.name_pl, url: `/kategoria/${cat.slug}` },
        ]}
      />
      <RecipeListing
        recipes={recipes}
        page={page}
        perPage={PER_PAGE}
        baseHref={`/kategoria/${cat.slug}`}
      />
    </div>
  );
}
