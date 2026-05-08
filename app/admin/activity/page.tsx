import { getRecentActivity } from '@/lib/db/queries/admin';
import { plPolishDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminActivityPage() {
  const rows = await getRecentActivity(50);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Aktywność</h1>
        <p className="mt-1 text-sm text-ink-soft">Ostatnie 50 zdarzeń w systemie.</p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-8 text-center text-ink-muted">
          Brak zdarzeń. Activity logger jeszcze nie loguje akcji — wprowadzimy w Day 5+.
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-md border border-line bg-surface px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-ink-muted">{plPolishDate(r.created_at)}</span>
                <span className="rounded-full bg-cream-deep px-2 py-0.5 text-xs font-semibold text-ink-soft">{r.action}</span>
              </div>
              <div className="mt-1.5 text-ink">
                <strong>{r.actor}</strong> · {r.entity}#{r.entity_id}
              </div>
              {r.metadata != null && (
                <pre className="mt-2 overflow-x-auto rounded-md bg-cream-deep p-2 text-xs">
                  {JSON.stringify(r.metadata, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
