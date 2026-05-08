import Link from 'next/link';
import { and, desc, eq, ilike, or } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { authors, recipes } from '@/lib/db/schema';
import { plPolishDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const PER_PAGE = 50;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  review: 'Weryfikacja',
  published: 'Opublikowane',
  archived: 'Archiwum',
};

const STATUS_BG: Record<string, string> = {
  draft: 'bg-ink-muted/20 text-ink-soft',
  review: 'bg-gold/20 text-ink',
  published: 'bg-sage/15 text-sage',
  archived: 'bg-line-strong/30 text-ink-muted',
};

export default async function AdminRecipesList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const status = sp.status?.trim() ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const conds = [];
  if (status && ['draft', 'review', 'published', 'archived'].includes(status)) {
    conds.push(eq(recipes.status, status as 'draft' | 'review' | 'published' | 'archived'));
  }
  if (q) {
    conds.push(or(ilike(recipes.title, `%${q}%`), ilike(recipes.slug, `%${q}%`)));
  }

  const rows = await db
    .select({
      id: recipes.id,
      slug: recipes.slug,
      title: recipes.title,
      status: recipes.status,
      category_slug: recipes.category_slug,
      published_at: recipes.published_at,
      updated_at: recipes.updated_at,
      author_name: authors.name,
    })
    .from(recipes)
    .innerJoin(authors, eq(recipes.author_id, authors.id))
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(recipes.updated_at))
    .limit(PER_PAGE)
    .offset((page - 1) * PER_PAGE);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Przepisy</h1>
          <p className="mt-1 text-sm text-ink-soft">{rows.length} wierszy</p>
        </div>
        <Link
          href="/admin/recipes/new"
          className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover"
        >
          + Nowy przepis
        </Link>
      </header>

      <form method="GET" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Szukaj po tytule lub slug..."
          className="flex-1 min-w-[240px] rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-terracotta"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-terracotta"
        >
          <option value="">Wszystkie statusy</option>
          <option value="draft">Szkic</option>
          <option value="review">Weryfikacja</option>
          <option value="published">Opublikowane</option>
          <option value="archived">Archiwum</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover"
        >
          Filtruj
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-cream-deep text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Tytuł</th>
              <th className="px-4 py-3 text-left font-semibold">Kategoria</th>
              <th className="px-4 py-3 text-left font-semibold">Autor</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Aktualizacja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-muted">
                  Brak przepisów.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-cream-deep/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/recipes/${r.id}`} className="font-medium text-ink hover:text-terracotta">
                      {r.title}
                    </Link>
                    <div className="text-xs text-ink-muted">/{r.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{r.category_slug}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.author_name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BG[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{plPolishDate(r.updated_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length === PER_PAGE && (
        <nav className="flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${status ? `&status=${status}` : ''}`}
              className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm hover:border-terracotta hover:text-terracotta"
            >
              ← Poprzednia
            </Link>
          )}
          <Link
            href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${status ? `&status=${status}` : ''}`}
            className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm hover:border-terracotta hover:text-terracotta"
          >
            Następna →
          </Link>
        </nav>
      )}
    </div>
  );
}
