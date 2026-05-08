import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';
import { RecipeListing } from '@/components/recipe/RecipeListing';
import { getAuthorBySlug, listAuthors } from '@/lib/db/queries/authors';
import { listRecipes } from '@/lib/db/queries/recipes';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://przepisy.ciastoeli.pl';

export const revalidate = 600;

const PER_PAGE = 24;

export async function generateStaticParams() {
  const all = await listAuthors();
  return all.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};
  return {
    title: `${author.name} — autor`,
    description: author.bio_short,
    alternates: { canonical: `/autor/${author.slug}` },
  };
}

function authorPersonJsonLd(author: Awaited<ReturnType<typeof getAuthorBySlug>>) {
  if (!author) return null;
  const social = author.social_links as Record<string, string> | null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: `${SITE_URL}/autor/${author.slug}`,
    jobTitle: author.role,
    description: author.bio,
    image: author.photo_url ?? undefined,
    sameAs: social ? Object.values(social).filter(Boolean) : undefined,
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const recipes = await listRecipes({
    authorSlug: slug,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  const breadcrumbs = [
    { name: 'Strona główna', url: '/' },
    { name: 'Autorzy', url: '/o-nas' },
    { name: author.name, url: `/autor/${author.slug}` },
  ];

  const ld = authorPersonJsonLd(author);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}

      <Breadcrumbs items={breadcrumbs} />

      <header className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div
          aria-hidden
          className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-terracotta text-3xl font-bold text-cream"
        >
          {author.name.charAt(0)}
        </div>
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-terracotta">Autor</span>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight sm:text-5xl">{author.name}</h1>
          <p className="mt-1 text-lg text-ink-soft">{author.role}</p>
          {author.expertise_years != null && (
            <p className="mt-1 text-sm text-ink-muted">{author.expertise_years} lat doświadczenia</p>
          )}
        </div>
      </header>

      <p className="mt-8 max-w-3xl text-lg leading-relaxed text-ink-soft">{author.bio}</p>

      {author.specialty.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {author.specialty.map((s) => (
            <span
              key={s}
              className="rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-ink-soft"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="my-12 h-px bg-line" />

      <h2 className="font-display text-3xl font-bold tracking-tight">Przepisy autora</h2>
      <div className="mt-6">
        <RecipeListing
          recipes={recipes}
          page={page}
          perPage={PER_PAGE}
          baseHref={`/autor/${author.slug}`}
          emptyText="Ten autor nie ma jeszcze opublikowanych przepisów."
        />
      </div>
    </div>
  );
}
