import 'server-only';
import { sql } from 'drizzle-orm';

import { db } from '../client';
import type { RecipeListItem } from './recipes';

/**
 * Polish-friendly full-text search using `simple` config + unaccent.
 * Stems fall back to prefix matching via tsquery.
 */
export async function searchRecipes(rawQuery: string, opts: { limit?: number; offset?: number } = {}): Promise<RecipeListItem[]> {
  const q = rawQuery.trim();
  if (!q) return [];
  const limit = opts.limit ?? 24;
  const offset = opts.offset ?? 0;

  // Build prefix tsquery: each word becomes word:* for partial matching
  const tsQueryStr = q
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map((w) => w.replace(/[^\p{L}\p{N}_]/gu, ''))
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(' & ');

  if (!tsQueryStr) return [];

  const result = await db.execute<RecipeListItem & { rank: number }>(sql`
    SELECT
      r.id,
      r.slug,
      r.title,
      r.description,
      r.hero_image_url,
      r.hero_image_alt,
      r.category_slug,
      r.cuisine_slug,
      r.diet_tags,
      r.tags,
      r.prep_time,
      r.cook_time,
      r.total_time,
      r.servings,
      r.difficulty,
      r.rating_avg,
      r.rating_count,
      r.published_at,
      a.name AS author_name,
      a.slug AS author_slug,
      ts_rank(
        setweight(to_tsvector('simple', unaccent(coalesce(r.title, ''))), 'A') ||
        setweight(to_tsvector('simple', unaccent(coalesce(r.description, ''))), 'B') ||
        setweight(to_tsvector('simple', unaccent(array_to_string(r.tags, ' '))), 'C'),
        to_tsquery('simple', unaccent(${tsQueryStr}))
      ) AS rank
    FROM recipes r
    INNER JOIN authors a ON a.id = r.author_id
    WHERE r.status = 'published' AND (
      to_tsvector('simple', unaccent(coalesce(r.title, '') || ' ' || coalesce(r.description, '') || ' ' || array_to_string(r.tags, ' ')))
      @@ to_tsquery('simple', unaccent(${tsQueryStr}))
    )
    ORDER BY rank DESC, r.published_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return Array.from(result) as RecipeListItem[];
}

export async function countSearchResults(rawQuery: string): Promise<number> {
  const q = rawQuery.trim();
  if (!q) return 0;
  const tsQueryStr = q
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map((w) => w.replace(/[^\p{L}\p{N}_]/gu, ''))
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(' & ');
  if (!tsQueryStr) return 0;

  const result = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int AS count
    FROM recipes r
    WHERE r.status = 'published' AND (
      to_tsvector('simple', unaccent(coalesce(r.title, '') || ' ' || coalesce(r.description, '') || ' ' || array_to_string(r.tags, ' ')))
      @@ to_tsquery('simple', unaccent(${tsQueryStr}))
    )
  `);
  return Array.from(result)[0]?.count ?? 0;
}
