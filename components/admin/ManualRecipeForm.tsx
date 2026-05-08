'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Author, Category, Cuisine } from '@/lib/db/schema';

export function ManualRecipeForm({
  authors,
  categories,
  cuisines,
}: {
  authors: Author[];
  categories: Category[];
  cuisines: Cuisine[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    hero_image_url: '',
    hero_image_alt: '',
    category_slug: 'ciasta',
    cuisine_slug: 'polska',
    prep_time: 0,
    cook_time: 0,
    servings: 4,
    difficulty: 'łatwy',
    author_id: authors[0]?.id ?? 1,
    ingredients: '',
    instructions: '',
    notes: '',
    tags: '',
    diet_tags: '',
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setSubmitting(true);
    setError('');

    const ingredients = form.ingredients
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((raw) => {
        const m = raw.match(/^([\d,.\s/]+)\s*(g|kg|ml|l|szt|łyżka|łyżeczka|szklanka)?\s+(.+)$/i);
        if (m) {
          const amountStr = m[1].replace(',', '.').replace(/\s+/g, '');
          const amount = Number(amountStr);
          return {
            raw,
            amount: Number.isFinite(amount) ? amount : null,
            unit: m[2]?.toLowerCase() ?? null,
            name: m[3].trim(),
          };
        }
        return { raw, amount: null, unit: null, name: raw };
      });

    const instructions = form.instructions
      .split(/\n{2,}|\n(?=\d+[.)]\s)/)
      .map((s, i) => ({ step: i + 1, text: s.replace(/^\d+[.)]\s*/, '').trim() }))
      .filter((s) => s.text.length > 0);

    const total = (Number(form.prep_time) || 0) + (Number(form.cook_time) || 0);
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-zżźćńółęąś0-9]+/g, '-').replace(/^-|-$/g, '');

    try {
      const res = await fetch('/api/admin/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug,
          description: form.description,
          hero_image_url: form.hero_image_url || 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d',
          hero_image_alt: form.hero_image_alt || form.title,
          category_slug: form.category_slug,
          cuisine_slug: form.cuisine_slug || null,
          prep_time: Number(form.prep_time) || null,
          cook_time: Number(form.cook_time) || null,
          total_time: total > 0 ? total : null,
          servings: Number(form.servings) || 1,
          difficulty: form.difficulty || null,
          author_id: Number(form.author_id),
          ingredients,
          instructions,
          notes: form.notes || null,
          tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
          diet_tags: form.diet_tags.split(',').map((s) => s.trim()).filter(Boolean),
          source: 'admin-manual',
          status: 'draft',
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = await res.json();
      router.push(`/admin/recipes/${j.recipe.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta';

  return (
    <div className="space-y-5">
      <Card title="Podstawy">
        <Field label="Tytuł" required>
          <input value={form.title} onChange={(e) => update('title', e.target.value)} className={inputCls} required />
        </Field>
        <Field label="Slug (puste = generuj z tytułu)">
          <input value={form.slug} onChange={(e) => update('slug', e.target.value)} className={`${inputCls} font-mono text-sm`} />
        </Field>
        <Field label="Opis (lead, 2-3 zdania)" required>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            className={inputCls}
            required
          />
        </Field>
        <Field label="URL zdjęcia hero">
          <input value={form.hero_image_url} onChange={(e) => update('hero_image_url', e.target.value)} className={inputCls} />
        </Field>
        <Field label="ALT zdjęcia (frazy kluczowe)">
          <input value={form.hero_image_alt} onChange={(e) => update('hero_image_alt', e.target.value)} className={inputCls} />
        </Field>
      </Card>

      <Card title="Klasyfikacja">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kategoria">
            <select value={form.category_slug} onChange={(e) => update('category_slug', e.target.value)} className={inputCls}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name_pl}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kuchnia">
            <select value={form.cuisine_slug} onChange={(e) => update('cuisine_slug', e.target.value)} className={inputCls}>
              <option value="">—</option>
              {cuisines.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name_pl}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Autor">
            <select value={form.author_id} onChange={(e) => update('author_id', Number(e.target.value))} className={inputCls}>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trudność">
            <select value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)} className={inputCls}>
              <option value="łatwy">łatwy</option>
              <option value="średni">średni</option>
              <option value="trudny">trudny</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card title="Czas i porcje">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Przygotowanie (min)">
            <input type="number" min={0} value={form.prep_time} onChange={(e) => update('prep_time', Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Gotowanie (min)">
            <input type="number" min={0} value={form.cook_time} onChange={(e) => update('cook_time', Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Porcje">
            <input type="number" min={1} value={form.servings} onChange={(e) => update('servings', Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
      </Card>

      <Card title="Składniki">
        <Field label="Każdy składnik w nowej linii (np. 200 g mąki pszennej)">
          <textarea
            value={form.ingredients}
            onChange={(e) => update('ingredients', e.target.value)}
            rows={10}
            className={`${inputCls} font-mono text-sm`}
            placeholder={'200 g mąki pszennej\n2 jajka\n100 g masła'}
          />
        </Field>
      </Card>

      <Card title="Instrukcje">
        <Field label="Każdy krok w nowej linii (lub oddzielony pustą linią)">
          <textarea
            value={form.instructions}
            onChange={(e) => update('instructions', e.target.value)}
            rows={10}
            className={inputCls}
            placeholder={'Rozgrzej piekarnik do 180°C.\nW misce wymieszaj składniki.\nPiecz 30 minut.'}
          />
        </Field>
      </Card>

      <Card title="Dodatki">
        <Field label="Wskazówki kucharskie (opcjonalne)">
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} className={inputCls} />
        </Field>
        <Field label="Tagi (oddzielone przecinkami)">
          <input value={form.tags} onChange={(e) => update('tags', e.target.value)} className={inputCls} placeholder="domowy, klasyk" />
        </Field>
        <Field label="Diet tags (vegan, vegetarian, gluten-free, ...)">
          <input value={form.diet_tags} onChange={(e) => update('diet_tags', e.target.value)} className={inputCls} />
        </Field>
      </Card>

      {error && <div className="rounded-md bg-terracotta/10 p-3 text-sm text-terracotta">{error}</div>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-cream hover:bg-terracotta-hover disabled:opacity-50"
        >
          {submitting ? 'Zapisywanie...' : 'Zapisz jako szkic'}
        </button>
      </div>
    </div>
  );
}

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
