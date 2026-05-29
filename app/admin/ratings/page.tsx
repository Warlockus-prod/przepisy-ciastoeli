import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { recipeRatings, recipes } from '@/lib/db/schema';
import { plPolishDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminRatingsPage() {
  const pending = await db
    .select({
      id: recipeRatings.id,
      rating: recipeRatings.rating,
      comment: recipeRatings.comment,
      author_name: recipeRatings.author_name,
      created_at: recipeRatings.created_at,
      recipe_slug: recipes.slug,
      recipe_title: recipes.title,
    })
    .from(recipeRatings)
    .innerJoin(recipes, eq(recipeRatings.recipe_id, recipes.id))
    .where(eq(recipeRatings.is_approved, false))
    .orderBy(desc(recipeRatings.created_at))
    .limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Oceny — moderacja</h1>
        <p className="mt-1 text-sm text-ink-soft">{pending.length} oczekujących na zatwierdzenie.</p>
      </header>

      {pending.length === 0 ? (
        <div className="rounded-lg border border-line bg-cream-deep p-8 text-center text-ink-muted">
          Brak ocen do moderacji.
        </div>
      ) : (
        <ul className="space-y-3">
          {pending.map((r) => (
            <li key={r.id} className="rounded-lg border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm">
                    <strong>{r.author_name}</strong> · {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} ·{' '}
                    <Link href={`/przepisy/${r.recipe_slug}`} target="_blank" className="text-terracotta hover:underline">
                      {r.recipe_title}
                    </Link>
                  </p>
                  <p className="text-xs text-ink-muted">{plPolishDate(r.created_at)}</p>
                </div>
              </div>
              {r.comment && <p className="mt-2 text-ink-soft">{r.comment}</p>}
              <p className="mt-3 text-xs text-ink-muted">
                Zatwierdzanie/odrzucanie przez API — UI akcji wkrótce. (Tymczasowo: SQL na bazie.)
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
