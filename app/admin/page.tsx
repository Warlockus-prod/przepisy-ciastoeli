import Link from 'next/link';

import { getAdminStats } from '@/lib/db/queries/admin';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Pulpit</h1>
        <p className="mt-1 text-sm text-ink-soft">Statystyki i ostatnia aktywność.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Wszystkie przepisy" value={stats.recipes.total} link="/admin/recipes" />
        <StatCard label="Opublikowane" value={stats.recipes.published} accent="sage" />
        <StatCard label="Szkice" value={stats.recipes.draft} link="/admin/recipes?status=draft" />
        <StatCard label="W weryfikacji" value={stats.recipes.review} link="/admin/recipes?status=review" />
        <StatCard label="Autorzy" value={stats.authors} link="/admin/authors" />
        <StatCard
          label="Oczekujące oceny"
          value={stats.pendingRatings}
          link="/admin/ratings"
          accent={stats.pendingRatings > 0 ? 'terracotta' : undefined}
        />
        <StatCard label="Joby w kolejce" value={stats.pendingJobs} link="/admin/queue" />
      </div>

      <section className="rounded-lg border border-line bg-surface p-6">
        <h2 className="font-display text-xl font-semibold">Szybkie akcje</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/recipes/new"
            className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover"
          >
            + Nowy przepis
          </Link>
          <Link
            href="/admin/recipes?status=draft"
            className="rounded-full border border-line bg-cream-deep px-5 py-2 text-sm font-semibold text-ink-soft hover:border-terracotta hover:text-terracotta"
          >
            Szkice do opublikowania
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  link,
  accent,
}: {
  label: string;
  value: number | string;
  link?: string;
  accent?: 'sage' | 'terracotta';
}) {
  const valueClass =
    accent === 'sage'
      ? 'text-sage'
      : accent === 'terracotta'
        ? 'text-terracotta'
        : 'text-ink';

  const inner = (
    <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-5">
      <div className={`font-display text-3xl font-bold tabular-nums ${valueClass}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-ink-muted">{label}</div>
    </div>
  );

  return link ? (
    <Link href={link} className="block transition-colors hover:[&>*]:border-terracotta">
      {inner}
    </Link>
  ) : (
    inner
  );
}
