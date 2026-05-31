import Link from 'next/link';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { authors } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function AdminAuthorsPage() {
  const rows = await db
    .select({
      id: authors.id,
      slug: authors.slug,
      name: authors.name,
      role: authors.role,
      is_primary: authors.is_primary,
      is_active: authors.is_active,
      recipes_count: sql<number>`COALESCE((SELECT COUNT(*)::int FROM recipes r WHERE r.author_id = ${authors.id}), 0)`,
    })
    .from(authors)
    .orderBy(authors.name);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Autorzy</h1>
          <p className="mt-1 text-sm text-ink-soft">{rows.length} kont autorskich w systemie.</p>
        </div>
        <Link
          href="/admin/authors/new"
          className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover"
        >
          + Nowy autor
        </Link>
      </header>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-cream-deep text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Nazwa</th>
              <th className="px-4 py-3 text-left font-semibold">Rola</th>
              <th className="px-4 py-3 text-left font-semibold">Slug</th>
              <th className="px-4 py-3 text-right font-semibold">Przepisów</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-cream-deep/50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/authors/${a.id}`} className="hover:text-terracotta">
                    {a.name}
                    {a.is_primary && (
                      <span className="ml-2 rounded-full bg-terracotta/10 px-2 py-0.5 text-[10px] font-bold uppercase text-terracotta">
                        Primary
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{a.role}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">/{a.slug}</td>
                <td className="px-4 py-3 text-right tabular-nums">{a.recipes_count}</td>
                <td className="px-4 py-3">
                  {a.is_active ? (
                    <span className="rounded-full bg-sage/15 px-2 py-0.5 text-xs font-semibold text-sage">aktywny</span>
                  ) : (
                    <span className="rounded-full bg-ink-muted/20 px-2 py-0.5 text-xs font-semibold text-ink-soft">nieaktywny</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-ink-muted">
        Kliknij nazwę autora aby edytować. Autora z przypisanymi przepisami nie można usunąć — najpierw przepisz jego przepisy na innego autora.
      </p>
    </div>
  );
}
