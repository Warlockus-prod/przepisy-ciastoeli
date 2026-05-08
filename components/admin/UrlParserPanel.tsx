'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Sparkles, Link as LinkIcon, Loader2 } from 'lucide-react';

import type { Author, Category, Cuisine } from '@/lib/db/schema';

type ParseResponse = {
  ok: true;
  mode: 'ai-rewritten' | 'extracted-only' | 'ai-failed-fallback';
  source_url: string;
  extracted_method: string;
  recipe: Record<string, unknown>;
  notes_to_admin?: string;
};

export function UrlParserPanel({
  authors,
  categories,
  cuisines,
}: {
  authors: Author[];
  categories: Category[];
  cuisines: Cuisine[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [authorId, setAuthorId] = useState(authors[0]?.id ?? 1);
  const [publishing, setPublishing] = useState(false);

  const onParse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), use_ai: useAI }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setResult(j);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd');
    } finally {
      setSubmitting(false);
    }
  };

  const onPublish = async () => {
    if (!result) return;
    setPublishing(true);
    setError('');
    try {
      const r = result.recipe as Record<string, unknown>;
      const slug = (r.title as string).toLowerCase()
        .replace(/[ąćęłńóśźż]/g, (c) => ({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' }[c] ?? c))
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const total = (Number(r.prep_time) || 0) + (Number(r.cook_time) || 0);

      const res = await fetch('/api/admin/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: r.title,
          slug: r.slug ?? slug,
          description: r.description,
          hero_image_url: r.hero_image_url ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&q=85',
          hero_image_alt: r.title,
          category_slug: r.category_slug ?? r.category_hint ?? 'obiady',
          cuisine_slug: r.cuisine_slug ?? r.cuisine_hint ?? null,
          prep_time: Number(r.prep_time) || null,
          cook_time: Number(r.cook_time) || null,
          total_time: total > 0 ? total : null,
          servings: Number(r.servings) || 4,
          difficulty: r.difficulty ?? null,
          author_id: Number(authorId),
          ingredients: r.ingredients,
          instructions: r.instructions,
          notes: r.notes ?? null,
          tags: r.tags ?? [],
          diet_tags: r.diet_tags ?? [],
          source: 'admin-url',
          status: 'draft',
          meta_title: r.meta_title ?? null,
          meta_description: r.meta_description ?? null,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      router.push(`/admin/recipes/${j.recipe.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd publikacji');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={onParse} className="space-y-4 rounded-lg border border-line bg-surface p-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">URL przepisu (np. aniagotuje.pl/przepis/...)</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://example.com/przepis/szarlotka"
            className="w-full rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            className="h-4 w-4 accent-terracotta"
          />
          <Sparkles size={14} className="text-terracotta" />
          Użyj AI rewrite (jeśli OPENAI_API_KEY ustawiony)
        </label>
        <button
          type="submit"
          disabled={submitting || !url}
          className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover disabled:opacity-50"
        >
          {submitting ? <><Loader2 size={14} className="animate-spin" /> Przetwarzanie...</> : <><LinkIcon size={14} /> Importuj</>}
        </button>
      </form>

      {error && <div className="rounded-md bg-terracotta/10 p-3 text-sm text-terracotta">{error}</div>}

      {result && (
        <div className="space-y-4 rounded-lg border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-cream-deep px-2 py-0.5 font-mono">mode: {result.mode}</span>
            <span className="rounded-full bg-cream-deep px-2 py-0.5 font-mono">extracted: {result.extracted_method}</span>
          </div>
          {result.notes_to_admin && (
            <p className="rounded-md bg-gold/10 p-3 text-sm text-ink-soft">{result.notes_to_admin}</p>
          )}

          <div>
            <h2 className="font-display text-xl font-semibold">{(result.recipe.title as string) ?? 'Bez tytułu'}</h2>
            <p className="mt-1 text-sm text-ink-soft">{(result.recipe.description as string) ?? ''}</p>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer font-medium text-ink-muted">Pełny JSON</summary>
            <pre className="mt-2 overflow-x-auto rounded-md bg-cream-deep p-3">
              {JSON.stringify(result.recipe, null, 2)}
            </pre>
          </details>

          <div className="flex items-center gap-3 border-t border-line pt-4">
            <label className="text-sm">
              <span className="mb-1 block text-ink-soft">Autor</span>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(Number(e.target.value))}
                className="rounded-md border border-line bg-surface px-3 py-2"
              >
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={onPublish}
              disabled={publishing}
              className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover disabled:opacity-50"
            >
              {publishing ? 'Zapisywanie...' : 'Zapisz jako szkic'}
            </button>
          </div>
          {/* Hidden fields used by useState — referenced for type-check */}
          <input type="hidden" value={categories.length} readOnly />
          <input type="hidden" value={cuisines.length} readOnly />
        </div>
      )}
    </div>
  );
}
