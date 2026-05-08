import type { Metadata } from 'next';
import Link from 'next/link';

import { RecipeCard } from '@/components/recipe/RecipeCard';
import { listRecipes } from '@/lib/db/queries/recipes';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Wszystkie przepisy',
  description: 'Pełna baza przepisów — ciasta, desery, obiady, zupy, sałatki i więcej.',
};

const PER_PAGE = 24;

export default async function AllRecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const recipes = await listRecipes({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-terracotta">
          Baza przepisów
        </span>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Wszystkie przepisy
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Sprawdzone domowe przepisy — od klasyki polskiej kuchni po nowoczesne propozycje.
        </p>
      </header>

      {recipes.length === 0 ? (
        <p className="text-ink-soft">Nie znaleziono przepisów.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}

      {recipes.length === PER_PAGE && (
        <nav className="mt-12 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/przepisy?page=${page - 1}`}
              className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-ink-soft hover:border-terracotta hover:text-terracotta"
            >
              ← Poprzednia
            </Link>
          )}
          <Link
            href={`/przepisy?page=${page + 1}`}
            className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-ink-soft hover:border-terracotta hover:text-terracotta"
          >
            Następna →
          </Link>
        </nav>
      )}
    </div>
  );
}
