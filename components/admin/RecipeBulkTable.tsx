'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Archive, CheckCircle, Eye, Trash2 } from 'lucide-react';

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

export type RecipeRow = {
  id: number;
  slug: string;
  title: string;
  status: string;
  category_slug: string;
  author_name: string;
  updated_at_label: string;
};

export function RecipeBulkTable({ rows }: { rows: RecipeRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0;

  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));

  const run = async (action: 'publish' | 'unpublish' | 'archive' | 'delete') => {
    if (selected.size === 0) return;
    const labels: Record<string, string> = {
      publish: 'opublikować',
      unpublish: 'cofnąć do szkicu',
      archive: 'zarchiwizować',
      delete: 'TRWALE usunąć',
    };
    if (!confirm(`Na pewno ${labels[action]} ${selected.size} przepisów?`)) return;

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/recipes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setMsg({ type: 'ok', text: `Zmieniono ${j.affected} przepisów (${action}).` });
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Błąd' });
    } finally {
      setBusy(false);
    }
  };

  const bar = useMemo(
    () => (
      <div
        className={`sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-cream-deep px-4 py-2.5 transition-opacity ${
          someSelected ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <span className="text-sm font-medium text-ink">Zaznaczono: {selected.size}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <BulkBtn onClick={() => run('publish')} disabled={busy} icon={<CheckCircle size={13} />} variant="primary">
            Opublikuj
          </BulkBtn>
          <BulkBtn onClick={() => run('unpublish')} disabled={busy} icon={<Eye size={13} />}>
            Do szkicu
          </BulkBtn>
          <BulkBtn onClick={() => run('archive')} disabled={busy} icon={<Archive size={13} />}>
            Archiwizuj
          </BulkBtn>
          <BulkBtn onClick={() => run('delete')} disabled={busy} icon={<Trash2 size={13} />}>
            Usuń
          </BulkBtn>
        </div>
      </div>
    ),
    [someSelected, selected.size, busy], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-3">
      {bar}
      {msg && (
        <div className={msg.type === 'ok' ? 'rounded-md bg-sage/10 p-3 text-sm text-sage' : 'rounded-md bg-terracotta/10 p-3 text-sm text-terracotta'}>
          {msg.text}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-cream-deep text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-terracotta" aria-label="Zaznacz wszystkie" />
              </th>
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
                <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">Brak przepisów.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className={`transition-colors hover:bg-cream-deep/50 ${selected.has(r.id) ? 'bg-terracotta/[0.04]' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 accent-terracotta" aria-label={`Zaznacz ${r.title}`} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/recipes/${r.id}`} className="font-medium text-ink hover:text-terracotta">
                      {r.title}
                    </Link>
                    <div className="text-xs text-ink-muted">/{r.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{r.category_slug}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.author_name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BG[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{r.updated_at_label}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BulkBtn({
  onClick,
  disabled,
  icon,
  variant,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  variant?: 'primary';
  children: React.ReactNode;
}) {
  const cls =
    variant === 'primary'
      ? 'bg-terracotta text-cream hover:bg-terracotta-hover'
      : 'border border-line bg-surface text-ink-soft hover:border-terracotta hover:text-terracotta';
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-50 ${cls}`}>
      {icon}
      {children}
    </button>
  );
}
