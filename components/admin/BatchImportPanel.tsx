'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';

import type { Author } from '@/lib/db/schema';

type ImportResult = {
  ok: true;
  summary: { total: number; created: number; skipped: number; failed: number };
  results: Array<{ title: string; status: string; reason?: string; id?: number }>;
};

export function BatchImportPanel({ authors }: { authors: Author[] }) {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [authorId, setAuthorId] = useState<number | ''>('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (file.name.endsWith('.csv')) {
      setRaw(JSON.stringify(csvToRecipes(text), null, 2));
    } else {
      setRaw(text);
    }
  };

  const onSubmit = async () => {
    setError('');
    setResult(null);
    let recipesArr: unknown;
    try {
      const parsed = JSON.parse(raw);
      recipesArr = Array.isArray(parsed) ? parsed : parsed.recipes;
      if (!Array.isArray(recipesArr)) throw new Error('JSON musi być tablicą lub {recipes:[...]}');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieprawidłowy JSON');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes: recipesArr, default_author_id: authorId || undefined, status }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setResult(j);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd importu');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta';

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-lg border border-line bg-surface p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-ink-soft">Autor (domyślny)</span>
            <select value={authorId} onChange={(e) => setAuthorId(e.target.value ? Number(e.target.value) : '')} className={inputCls}>
              <option value="">— primary —</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-soft">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className={inputCls}>
              <option value="draft">Szkic</option>
              <option value="published">Opublikowane</option>
            </select>
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line bg-cream-deep px-4 py-2 text-sm font-medium text-ink-soft hover:border-terracotta">
            <Upload size={14} /> Wgraj plik (.json/.csv)
            <input type="file" accept=".json,.csv" onChange={onFile} className="hidden" />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">
            JSON (tablica przepisów lub {'{'}recipes: [...]{'}'})
          </span>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={14}
            placeholder='[{"title":"...","ingredients":["200 g mąki"],"instructions":["Wymieszaj."],"category":"ciasta"}]'
            className={`${inputCls} w-full font-mono text-xs`}
          />
        </label>

        {error && <div className="rounded-md bg-terracotta/10 p-3 text-sm text-terracotta">{error}</div>}

        <button
          onClick={onSubmit}
          disabled={submitting || !raw.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-cream hover:bg-terracotta-hover disabled:opacity-50"
        >
          {submitting ? <><Loader2 size={14} className="animate-spin" /> Importowanie...</> : 'Importuj'}
        </button>
      </section>

      {result && (
        <section className="space-y-3 rounded-lg border border-line bg-surface p-5">
          <div className="flex flex-wrap gap-4 text-sm">
            <Stat label="Razem" value={result.summary.total} />
            <Stat label="Dodano" value={result.summary.created} accent="sage" />
            <Stat label="Pominięto" value={result.summary.skipped} />
            <Stat label="Błędy" value={result.summary.failed} accent={result.summary.failed > 0 ? 'terracotta' : undefined} />
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-ink-muted">Szczegóły ({result.results.length})</summary>
            <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto">
              {result.results.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-2 border-b border-line py-1">
                  <span className="truncate">{r.title}</span>
                  <span
                    className={
                      r.status === 'created' ? 'text-sage' : r.status === 'failed' ? 'text-terracotta' : 'text-ink-muted'
                    }
                  >
                    {r.status}{r.reason ? ` — ${r.reason}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: 'sage' | 'terracotta' }) {
  const cls = accent === 'sage' ? 'text-sage' : accent === 'terracotta' ? 'text-terracotta' : 'text-ink';
  return (
    <div>
      <div className={`font-display text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-ink-muted">{label}</div>
    </div>
  );
}

// Minimal CSV → recipe[] (header row, ; or , delimited; ingredients/instructions split on |)
function csvToRecipes(csv: string): Array<Record<string, unknown>> {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const delim = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delim).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(delim);
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const v = (cells[i] ?? '').trim();
      if (h === 'ingredients' || h === 'instructions' || h === 'tags' || h === 'diet_tags') {
        obj[h] = v ? v.split('|').map((s) => s.trim()).filter(Boolean) : [];
      } else if (['prep_time', 'cook_time', 'prep_time_minutes', 'cook_time_minutes', 'servings'].includes(h)) {
        obj[h] = v ? Number(v) : null;
      } else {
        obj[h] = v;
      }
    });
    return obj;
  });
}
