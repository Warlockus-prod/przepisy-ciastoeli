import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ListingHeader } from '@/components/recipe/ListingHeader';
import { RecipeListing } from '@/components/recipe/RecipeListing';
import { getDietTagBySlug } from '@/lib/db/queries/taxonomy';
import { listRecipes } from '@/lib/db/queries/recipes';

export const revalidate = 300;
export const dynamicParams = true;

const PER_PAGE = 24;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const diet = await getDietTagBySlug(slug);
  if (!diet) return {};
  return {
    title: `Przepisy ${diet.name_pl}`,
    description: diet.description ?? `Przepisy z dietą ${diet.name_pl}.`,
    alternates: { canonical: `/dieta/${diet.slug}` },
  };
}

export default async function DietPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const diet = await getDietTagBySlug(slug);
  if (!diet) notFound();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const recipes = await listRecipes({
    dietTag: slug,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ListingHeader
        eyebrow="Dieta"
        title={diet.name_pl}
        description={diet.description}
        breadcrumbs={[
          { name: 'Strona główna', url: '/' },
          { name: 'Diety', url: '/diety' },
          { name: diet.name_pl, url: `/dieta/${diet.slug}` },
        ]}
      />
      <RecipeListing
        recipes={recipes}
        page={page}
        perPage={PER_PAGE}
        baseHref={`/dieta/${diet.slug}`}
      />
    </div>
  );
}
