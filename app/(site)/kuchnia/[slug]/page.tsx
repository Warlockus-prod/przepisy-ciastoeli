import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ListingHeader } from '@/components/recipe/ListingHeader';
import { RecipeListing } from '@/components/recipe/RecipeListing';
import { getCuisineBySlug, listAllCuisineSlugs } from '@/lib/db/queries/taxonomy';
import { listRecipes } from '@/lib/db/queries/recipes';

export const revalidate = 300;

const PER_PAGE = 24;

export async function generateStaticParams() {
  const slugs = await listAllCuisineSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cuisine = await getCuisineBySlug(slug);
  if (!cuisine) return {};
  return {
    title: `Kuchnia ${cuisine.name_pl} — przepisy`,
    description: cuisine.description ?? `Przepisy z kuchni ${cuisine.name_pl}.`,
    alternates: { canonical: `/kuchnia/${cuisine.slug}` },
  };
}

export default async function CuisinePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const cuisine = await getCuisineBySlug(slug);
  if (!cuisine) notFound();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const recipes = await listRecipes({
    cuisineSlug: slug,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ListingHeader
        eyebrow="Kuchnia"
        title={cuisine.name_pl}
        description={cuisine.description}
        breadcrumbs={[
          { name: 'Strona główna', url: '/' },
          { name: 'Kuchnie', url: '/kuchnia' },
          { name: cuisine.name_pl, url: `/kuchnia/${cuisine.slug}` },
        ]}
      />
      <RecipeListing
        recipes={recipes}
        page={page}
        perPage={PER_PAGE}
        baseHref={`/kuchnia/${cuisine.slug}`}
      />
    </div>
  );
}
