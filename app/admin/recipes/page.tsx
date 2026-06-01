import Link from 'next/link';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { RecipeBulkTable, type RecipeRow } from '@/components/admin/RecipeBulkTable';
import { db } from '@/lib/db/client';
import { authors, recipes } from '@/lib/db/schema';
import { plPolishDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

const PER_PAGE = 50;

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

  const [rowsRaw, counts] = await Promise.all([
    db
      .select({
        id: recipes.id,
        slug: recipes.slug,
        title: recipes.title,
        status: recipes.status,
        category_slug: recipes.category_slug,
        updated_at: recipes.updated_at,
        author_name: authors.name,
      })
      .from(recipes)
      .innerJoin(authors, eq(recipes.author_id, authors.id))
      .where(conds.length > 0 ? and(...conds) : undefined)
      .orderBy(desc(recipes.updated_at))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db
      .select({ status: recipes.status, n: sql<number>`count(*)::int` })
      .from(recipes)
      .groupBy(recipes.status),
  ]);

  const rows: RecipeRow[] = rowsRaw.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    status: r.status,
    category_slug: r.category_slug,
    author_name: r.author_name,
    updated_at_label: plPolishDate(r.updated_at),
  }));

  const countBy = Object.fromEntries(counts.map((c) => [c.status, Number(c.n)]));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Przepisy</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {countBy.published ?? 0} opublikowanych · {countBy.draft ?? 0} szkiców
            {countBy.archived ? ` · ${countBy.archived} w archiwum` : ''}
          </p>
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

      <RecipeBulkTable rows={rows} />

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
