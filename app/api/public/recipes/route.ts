import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { authors, recipes } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get('ids') ?? '';
  const ids = idsParam
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 200);

  if (ids.length === 0) return NextResponse.json({ recipes: [] });

  const rows = await db
    .select({
      id: recipes.id,
      slug: recipes.slug,
      title: recipes.title,
      description: recipes.description,
      hero_image_url: recipes.hero_image_url,
      hero_image_alt: recipes.hero_image_alt,
      category_slug: recipes.category_slug,
      cuisine_slug: recipes.cuisine_slug,
      diet_tags: recipes.diet_tags,
      tags: recipes.tags,
      prep_time: recipes.prep_time,
      cook_time: recipes.cook_time,
      total_time: recipes.total_time,
      servings: recipes.servings,
      difficulty: recipes.difficulty,
      rating_avg: recipes.rating_avg,
      rating_count: recipes.rating_count,
      published_at: recipes.published_at,
      author_name: authors.name,
      author_slug: authors.slug,
    })
    .from(recipes)
    .innerJoin(authors, eq(recipes.author_id, authors.id))
    .where(and(eq(recipes.status, 'published'), inArray(recipes.id, ids)));

  return NextResponse.json(
    { recipes: rows },
    { headers: { 'cache-control': 's-maxage=300, stale-while-revalidate=600' } },
  );
}
