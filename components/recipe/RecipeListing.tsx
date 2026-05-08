import Link from 'next/link';

import { RecipeCard } from '@/components/recipe/RecipeCard';
import type { RecipeListItem } from '@/lib/db/queries/recipes';

export function RecipeListing({
  recipes,
  emptyText = 'Nie znaleziono przepisów.',
  page,
  perPage,
  baseHref,
}: {
  recipes: RecipeListItem[];
  emptyText?: string;
  page?: number;
  perPage?: number;
  baseHref?: string;
}) {
  if (recipes.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-cream-deep p-8 text-center text-ink-soft">
        {emptyText}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>

      {page != null && perPage != null && recipes.length === perPage && baseHref && (
        <nav className="mt-12 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`${baseHref}${baseHref.includes('?') ? '&' : '?'}page=${page - 1}`}
              className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-ink-soft hover:border-terracotta hover:text-terracotta"
            >
              ← Poprzednia
            </Link>
          )}
          <Link
            href={`${baseHref}${baseHref.includes('?') ? '&' : '?'}page=${page + 1}`}
            className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-ink-soft hover:border-terracotta hover:text-terracotta"
          >
            Następna →
          </Link>
        </nav>
      )}
    </>
  );
}
