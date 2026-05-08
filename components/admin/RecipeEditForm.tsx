'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Author, Recipe } from '@/lib/db/schema';

const STATUSES = ['draft', 'review', 'published', 'archived'] as const;
const DIFFICULTIES = ['łatwy', 'średni', 'trudny'] as const;

export function RecipeEditForm({ recipe, authors }: { recipe: Recipe; authors: Author[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    hero_image_url: recipe.hero_image_url,
    hero_image_alt: recipe.hero_image_alt,
    category_slug: recipe.category_slug,
    cuisine_slug: recipe.cuisine_slug ?? '',
    prep_time: recipe.prep_time ?? 0,
    cook_time: recipe.cook_time ?? 0,
    servings: recipe.servings,
    difficulty: recipe.difficulty ?? '',
    status: recipe.status,
    is_featured: recipe.is_featured,
    is_news: recipe.is_news,
    notes: recipe.notes ?? '',
    author_id: recipe.author_id,
    meta_title: recipe.meta_title ?? '',
    meta_description: recipe.meta_description ?? '',
    diet_tags: (recipe.diet_tags ?? []).join(', '),
    tags: (recipe.tags ?? []).join(', '),
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const total = (Number(form.prep_time) || 0) + (Number(form.cook_time) || 0);
      const res = await fetch(`/api/admin/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          description: form.description,
          hero_image_url: form.hero_image_url,
          hero_image_alt: form.hero_image_alt,
          category_slug: form.category_slug,
          cuisine_slug: form.cuisine_slug || null,
          prep_time: Number(form.prep_time) || null,
          cook_time: Number(form.cook_time) || null,
          total_time: total > 0 ? total : null,
          servings: Number(form.servings) || 1,
          difficulty: form.difficulty || null,
          status: form.status,
          is_featured: form.is_featured,
          is_news: form.is_news,
          notes: form.notes || null,
          author_id: Number(form.author_id),
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
          diet_tags: form.diet_tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          tags: form.tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setMessage({ type: 'ok', text: 'Zapisano. Cache odświeżony.' });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Błąd zapisu.' });
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(`Usunąć przepis "${recipe.title}"? Akcja nieodwracalna.`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/recipes/${recipe.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Nie udało się usunąć.');
      router.push('/admin/recipes');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Błąd.' });
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Treść główna">
          <Field label="Tytuł" required>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              maxLength={255}
              className={inputCls}
            />
          </Field>
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              maxLength={255}
              className={inputCls + ' font-mono text-sm'}
            />
          </Field>
          <Field label="Opis (lead)" required>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className={inputCls}
            />
          </Field>
          <Field label="Wskazówki kucharskie">
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className={inputCls}
            />
          </Field>
        </Card>

        <Card title="Zdjęcie hero">
          <Field label="URL obrazu">
            <input
              value={form.hero_image_url}
              onChange={(e) => update('hero_image_url', e.target.value)}
              className={inputCls + ' text-sm'}
            />
          </Field>
          <Field label="ALT (z frazą kluczową)">
            <input
              value={form.hero_image_alt}
              onChange={(e) => update('hero_image_alt', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Card>

        <Card title="Czas i porcje">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Przygotowanie (min)">
              <input
                type="number"
                min={0}
                value={form.prep_time}
                onChange={(e) => update('prep_time', Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Gotowanie (min)">
              <input
                type="number"
                min={0}
                value={form.cook_time}
                onChange={(e) => update('cook_time', Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Porcje">
              <input
                type="number"
                min={1}
                value={form.servings}
                onChange={(e) => update('servings', Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Trudność">
            <select value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)} className={inputCls}>
              <option value="">—</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        <Card title="SEO">
          <Field label="Meta title (≤60)">
            <input
              value={form.meta_title}
              onChange={(e) => update('meta_title', e.target.value)}
              maxLength={100}
              className={inputCls}
            />
          </Field>
          <Field label="Meta description (140-180)">
            <textarea
              value={form.meta_description}
              onChange={(e) => update('meta_description', e.target.value)}
              maxLength={200}
              rows={2}
              className={inputCls}
            />
          </Field>
          <Field label="Tagi (oddzielone przecinkami)">
            <input value={form.tags} onChange={(e) => update('tags', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Diet tags (oddzielone przecinkami)">
            <input value={form.diet_tags} onChange={(e) => update('diet_tags', e.target.value)} className={inputCls} />
          </Field>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Publikacja">
          <Field label="Status">
            <select value={form.status} onChange={(e) => update('status', e.target.value as Recipe['status'])} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => update('is_featured', e.target.checked)}
              className="h-4 w-4 accent-terracotta"
            />
            Polecane (na stronie głównej)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_news}
              onChange={(e) => update('is_news', e.target.checked)}
              className="h-4 w-4 accent-terracotta"
            />
            Nowość (NewsArticle schema)
          </label>
        </Card>

        <Card title="Klasyfikacja">
          <Field label="Kategoria slug">
            <input
              value={form.category_slug}
              onChange={(e) => update('category_slug', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Kuchnia slug">
            <input
              value={form.cuisine_slug}
              onChange={(e) => update('cuisine_slug', e.target.value)}
              className={inputCls}
            />
          </Field>
        </Card>

        <Card title="Autor">
          <Field label="Wybierz">
            <select value={form.author_id} onChange={(e) => update('author_id', Number(e.target.value))} className={inputCls}>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.role}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        {message && (
          <div
            className={
              message.type === 'ok'
                ? 'rounded-md bg-sage/10 p-3 text-sm text-sage'
                : 'rounded-md bg-terracotta/10 p-3 text-sm text-terracotta'
            }
          >
            {message.text}
          </div>
        )}

        <div className="sticky bottom-4 space-y-2">
          <button
            type="button"
            onClick={onSave}
            disabled={submitting}
            className="w-full rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-cream hover:bg-terracotta-hover disabled:opacity-50"
          >
            {submitting ? 'Zapisywanie...' : 'Zapisz'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={submitting}
            className="w-full rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-terracotta hover:text-terracotta"
          >
            Usuń
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-line bg-surface p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">
        {label} {required && <span className="text-terracotta">*</span>}
      </span>
      {children}
    </label>
  );
}
