import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { isResponse, requireRole } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { authors, recipes } from '@/lib/db/schema';
import { parseIngredientLine, buildInstructions } from '@/lib/parsers/ingredient-normalizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

// Accepts the seed-recipe JSON shape (raw strings) OR pre-structured.
const RawRecipeSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  category_slug: z.string().optional(),
  cuisine: z.string().nullable().optional(),
  cuisine_slug: z.string().nullable().optional(),
  ingredients: z.array(z.union([z.string(), z.object({ raw: z.string() }).passthrough()])).default([]),
  instructions: z.array(z.string()).default([]),
  prep_time_minutes: z.number().nullable().optional(),
  cook_time_minutes: z.number().nullable().optional(),
  prep_time: z.number().nullable().optional(),
  cook_time: z.number().nullable().optional(),
  servings: z.number().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  diet_tags: z.array(z.string()).default([]),
  image_url: z.string().optional(),
  hero_image_url: z.string().optional(),
  source_url: z.string().optional(),
  author: z.string().optional(),
});

const InputSchema = z.object({
  recipes: z.array(RawRecipeSchema).min(1).max(500),
  default_author_id: z.number().int().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

const VALID_CAT = new Set([
  'ciasta', 'desery', 'obiady', 'zupy', 'salatki', 'sniadania', 'przekaski', 'napoje', 'przetwory', 'dla-dzieci',
]);
const CUISINE_MAP: Record<string, string> = {
  polska: 'polska', włoska: 'wloska', wloska: 'wloska', francuska: 'francuska', azjatycka: 'azjatycka',
  chińska: 'azjatycka', japońska: 'azjatycka', tajska: 'azjatycka', indyjska: 'azjatycka',
  grecka: 'grecka', hiszpańska: 'hiszpanska', hiszpanska: 'hiszpanska', meksykańska: 'meksykanska',
  meksykanska: 'meksykanska', amerykańska: 'amerykanska', amerykanska: 'amerykanska', angielska: 'angielska',
  niemiecka: 'niemiecka', międzynarodowa: 'miedzynarodowa', miedzynarodowa: 'miedzynarodowa',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => ({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 240);
}

export async function POST(req: Request) {
  const auth = await requireRole('admin');
  if (isResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', details: parsed.error.format() }, { status: 400 });
  }

  // Fallback author: explicit > primary > first
  let authorId = parsed.data.default_author_id;
  if (!authorId) {
    const [primary] = await db.select({ id: authors.id }).from(authors).where(eq(authors.is_primary, true)).limit(1);
    authorId = primary?.id ?? (await db.select({ id: authors.id }).from(authors).limit(1))[0]?.id;
  }
  if (!authorId) return NextResponse.json({ error: 'no author available' }, { status: 400 });

  const results: Array<{ title: string; status: 'created' | 'skipped' | 'failed'; reason?: string; id?: number }> = [];
  const touchedCategories = new Set<string>();
  let published = false;

  for (const r of parsed.data.recipes) {
    try {
      const ingredients = r.ingredients
        .map((i) => (typeof i === 'string' ? parseIngredientLine(i) : { raw: i.raw, amount: null, unit: null, name: i.raw }))
        .filter((i) => i.name || i.raw);
      const instructions = buildInstructions(r.instructions);

      if (ingredients.length === 0 || instructions.length === 0) {
        results.push({ title: r.title, status: 'skipped', reason: 'brak składników lub kroków' });
        continue;
      }

      const slug = r.slug || slugify(r.title);
      const category = VALID_CAT.has(r.category_slug ?? r.category ?? '') ? (r.category_slug ?? r.category)! : 'obiady';
      const cuisineRaw = (r.cuisine_slug ?? r.cuisine ?? '').toLowerCase();
      const cuisine = CUISINE_MAP[cuisineRaw] ?? (cuisineRaw && VALID_CAT.has(cuisineRaw) ? cuisineRaw : null);
      const prep = r.prep_time ?? r.prep_time_minutes ?? null;
      const cook = r.cook_time ?? r.cook_time_minutes ?? null;
      const total = prep != null && cook != null ? prep + cook : null;
      const difficulty = ['łatwy', 'średni', 'trudny'].includes(r.difficulty ?? '') ? r.difficulty : null;

      const [created] = await db
        .insert(recipes)
        .values({
          slug,
          title: r.title,
          description: r.description || `${r.title} — przepis krok po kroku.`,
          hero_image_url: r.hero_image_url || r.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&q=85',
          hero_image_alt: r.title,
          prep_time: prep,
          cook_time: cook,
          total_time: total,
          servings: r.servings && r.servings > 1 ? r.servings : 4,
          difficulty: difficulty as 'łatwy' | 'średni' | 'trudny' | null,
          ingredients,
          instructions,
          category_slug: category,
          cuisine_slug: cuisine,
          diet_tags: r.diet_tags ?? [],
          tags: r.tags ?? [],
          author_id: authorId,
          source: 'batch-import',
          source_url: r.source_url ?? null,
          status: parsed.data.status,
          published_at: parsed.data.status === 'published' ? new Date() : null,
          meta_description: (r.description ?? '').slice(0, 180) || null,
        })
        .onConflictDoNothing({ target: recipes.slug })
        .returning({ id: recipes.id });

      if (!created) {
        results.push({ title: r.title, status: 'skipped', reason: 'slug już istnieje' });
        continue;
      }
      results.push({ title: r.title, status: 'created', id: created.id });
      touchedCategories.add(category);
      if (parsed.data.status === 'published') published = true;
    } catch (err) {
      results.push({ title: r.title, status: 'failed', reason: (err as Error).message.slice(0, 120) });
    }
  }

  if (published) {
    revalidatePath('/');
    revalidatePath('/przepisy');
    for (const c of touchedCategories) revalidatePath(`/kategoria/${c}`);
  }

  const summary = {
    total: parsed.data.recipes.length,
    created: results.filter((r) => r.status === 'created').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
  };
  return NextResponse.json({ ok: true, summary, results });
}
