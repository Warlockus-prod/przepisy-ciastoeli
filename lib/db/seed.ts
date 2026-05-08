import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { eq, sql } from 'drizzle-orm';

import { db } from './client';
import { authors, categories, cuisines, dietTags, recipes } from './schema';
import type { Ingredient, Instruction, NewAuthor } from './schema';
import { SEED_AUTHORS, pickAuthorSlugForRecipe } from './seed-data/authors';
import { SEED_CATEGORIES, SEED_CUISINES, SEED_DIET_TAGS } from './seed-data/taxonomy';

type RawSeedRecipe = {
  title: string;
  slug: string;
  category: string;
  cuisine: string | null;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty: 'łatwy' | 'średni' | 'trudny' | null;
  tags: string[];
  diet_tags: string[];
  image_url: string;
  source_url: string;
  author: string;
};

const VALID_CATEGORY_SLUGS = new Set(SEED_CATEGORIES.map((c) => c.slug));
const CUISINE_NORMALIZE: Record<string, string> = {
  polska: 'polska',
  włoska: 'wloska',
  wloska: 'wloska',
  francuska: 'francuska',
  azjatycka: 'azjatycka',
  chińska: 'azjatycka',
  japońska: 'azjatycka',
  tajska: 'azjatycka',
  grecka: 'grecka',
  hiszpańska: 'hiszpanska',
  hiszpanska: 'hiszpanska',
  meksykańska: 'meksykanska',
  meksykanska: 'meksykanska',
  bliskowschodnia: 'bliskowschodnia',
  amerykańska: 'amerykanska',
  amerykanska: 'amerykanska',
  angielska: 'angielska',
  niemiecka: 'niemiecka',
  międzynarodowa: 'miedzynarodowa',
  miedzynarodowa: 'miedzynarodowa',
  indyjska: 'azjatycka',
  żydowska: 'bliskowschodnia',
  zydowska: 'bliskowschodnia',
  skandynawska: 'miedzynarodowa',
  marokańska: 'bliskowschodnia',
  marokanska: 'bliskowschodnia',
  węgierska: 'miedzynarodowa',
  wegierska: 'miedzynarodowa',
};

function normalizeCuisine(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  return CUISINE_NORMALIZE[lower] ?? null;
}

function parseIngredient(raw: string): Ingredient {
  const m = raw.match(/^\s*([\d,.\s/]+)\s*(g|kg|ml|l|szt|łyżka|łyżeczka|szklanka|opakowanie|szczypta)?\s+(.+)$/i);
  if (!m) return { raw, amount: null, unit: null, name: raw.trim() };
  const amountStr = m[1].replace(',', '.').replace(/\s+/g, '').replace(/\/$/, '');
  let amount: number | null = null;
  if (amountStr.includes('/')) {
    const [num, den] = amountStr.split('/').map(Number);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) amount = num / den;
  } else {
    const n = Number(amountStr);
    if (!Number.isNaN(n)) amount = n;
  }
  return {
    raw: raw.trim(),
    amount,
    unit: m[2]?.toLowerCase() ?? null,
    name: m[3].trim(),
  };
}

function buildInstructions(steps: string[]): Instruction[] {
  return steps.map((text, i) => ({ step: i + 1, text: text.trim() }));
}

function ensureValidCategory(cat: string): string {
  return VALID_CATEGORY_SLUGS.has(cat) ? cat : 'obiady';
}

function loadSeedRecipes(): RawSeedRecipe[] {
  const dir = join(process.cwd(), 'seed-recipes');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as RawSeedRecipe);
}

async function main() {
  console.log('🌱 Seeding ciastoeli database...');

  await db.execute(sql`SET client_min_messages TO WARNING`);

  console.log('  → categories');
  for (const c of SEED_CATEGORIES) {
    await db.insert(categories).values(c).onConflictDoNothing();
  }

  console.log('  → cuisines');
  for (const c of SEED_CUISINES) {
    await db.insert(cuisines).values(c).onConflictDoNothing();
  }

  console.log('  → diet_tags');
  for (const d of SEED_DIET_TAGS) {
    await db.insert(dietTags).values(d).onConflictDoNothing();
  }

  console.log('  → authors');
  const authorIdBySlug = new Map<string, number>();
  for (const a of SEED_AUTHORS) {
    const inserted = await db
      .insert(authors)
      .values(a as NewAuthor)
      .onConflictDoNothing()
      .returning({ id: authors.id, slug: authors.slug });
    if (inserted[0]) {
      authorIdBySlug.set(inserted[0].slug, inserted[0].id);
    } else {
      const existing = await db.select({ id: authors.id, slug: authors.slug }).from(authors).where(eq(authors.slug, a.slug));
      if (existing[0]) authorIdBySlug.set(existing[0].slug, existing[0].id);
    }
  }
  console.log(`    inserted/found ${authorIdBySlug.size} authors`);

  console.log('  → recipes');
  const seedRecipes = loadSeedRecipes();
  let inserted = 0;
  let skipped = 0;
  for (const r of seedRecipes) {
    if (!r.title || !r.slug || !r.ingredients?.length || !r.instructions?.length || !r.image_url) {
      skipped++;
      continue;
    }
    const isFromOldSite = r.author === 'Ela';
    const authorSlug = isFromOldSite
      ? 'ela'
      : pickAuthorSlugForRecipe(r.category, normalizeCuisine(r.cuisine), r.diet_tags);
    const authorId = authorIdBySlug.get(authorSlug);
    if (!authorId) {
      console.warn(`    ⚠ author '${authorSlug}' missing for ${r.slug}`);
      skipped++;
      continue;
    }

    const prep = r.prep_time_minutes;
    const cook = r.cook_time_minutes;
    const total = prep != null && cook != null ? prep + cook : null;
    const servings = r.servings && r.servings > 1 ? r.servings : 4;
    const category = ensureValidCategory(r.category);
    const cuisineSlug = normalizeCuisine(r.cuisine);

    const ingredients = r.ingredients.map(parseIngredient);
    const instructions = buildInstructions(r.instructions);

    try {
      await db
        .insert(recipes)
        .values({
          slug: r.slug,
          title: r.title,
          description: r.description || `${r.title} — przepis krok po kroku.`,
          hero_image_url: r.image_url,
          hero_image_alt: r.title,
          prep_time: prep,
          cook_time: cook,
          total_time: total,
          servings,
          difficulty: r.difficulty,
          ingredients,
          instructions,
          category_slug: category,
          cuisine_slug: cuisineSlug,
          diet_tags: r.diet_tags ?? [],
          tags: r.tags ?? [],
          author_id: authorId,
          source: isFromOldSite ? 'seed' : 'seed',
          source_url: r.source_url,
          status: 'published',
          published_at: new Date(),
          meta_title: r.title.length <= 60 ? r.title : r.title.slice(0, 57) + '...',
          meta_description: r.description?.slice(0, 180) ?? null,
        })
        .onConflictDoNothing();
      inserted++;
    } catch (err) {
      console.warn(`    ⚠ failed ${r.slug}: ${(err as Error).message}`);
      skipped++;
    }
  }
  console.log(`    inserted ${inserted} recipes, skipped ${skipped}`);

  console.log('✅ Seed complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
