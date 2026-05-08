import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';

import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';
import { RecipeListing } from '@/components/recipe/RecipeListing';
import { searchRecipes, countSearchResults } from '@/lib/db/queries/search';

export const dynamic = 'force-dynamic';

const PER_PAGE = 24;

export const metadata: Metadata = {
  title: 'Wyszukaj przepisy',
  description: 'Wyszukaj przepisy po nazwie, składnikach lub frazach kluczowych.',
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const [recipes, total] = q
    ? await Promise.all([
        searchRecipes(q, { limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
        countSearchResults(q),
      ])
    : [[], 0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { name: 'Strona główna', url: '/' },
          { name: 'Wyszukiwanie', url: '/wyszukaj' },
        ]}
      />

      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Wyszukaj przepisy</h1>

      <form method="GET" className="mt-6 flex max-w-xl items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 shadow-[var(--shadow-card)] focus-within:border-terracotta">
        <Search size={18} className="shrink-0 text-ink-muted" strokeWidth={1.75} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="np. szarlotka, bigos, wegańska zupa..."
          className="flex-1 bg-transparent py-1.5 text-base outline-none placeholder:text-ink-muted"
          autoComplete="off"
        />
        <button
          type="submit"
          className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-semibold text-cream transition-colors hover:bg-terracotta-hover"
        >
          Szukaj
        </button>
      </form>

      {q ? (
        <>
          <p className="mt-6 text-sm text-ink-soft">
            {total === 0 ? (
              <>Brak wyników dla <strong className="text-ink">„{q}"</strong>.</>
            ) : (
              <>
                Znaleziono <strong className="text-ink">{total}</strong> {total === 1 ? 'przepis' : total < 5 ? 'przepisy' : 'przepisów'} dla <strong className="text-ink">„{q}"</strong>.
              </>
            )}
          </p>

          <div className="mt-8">
            {recipes.length > 0 ? (
              <RecipeListing
                recipes={recipes}
                page={page}
                perPage={PER_PAGE}
                baseHref={`/wyszukaj?q=${encodeURIComponent(q)}`}
              />
            ) : (
              <div className="rounded-lg border border-line bg-cream-deep p-8 text-center text-ink-soft">
                <p>Spróbuj prostszego zapytania lub przejrzyj{' '}
                  <Link href="/przepisy" className="font-semibold text-terracotta hover:underline">wszystkie przepisy</Link>.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="mt-8 text-ink-soft">Wpisz frazę aby rozpocząć wyszukiwanie.</p>
      )}
    </div>
  );
}
