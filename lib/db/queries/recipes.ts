import 'server-only';
import { and, desc, eq, ne, or, sql } from 'drizzle-orm';

import { db } from '../client';
import { authors, categories, cuisines, recipes } from '../schema';
import type { Author, Recipe } from '../schema';

export type RecipeWithAuthor = Recipe & { author: Author };
export type RecipeListItem = Pick<
  Recipe,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'hero_image_url'
  | 'hero_image_alt'
  | 'category_slug'
  | 'cuisine_slug'
  | 'diet_tags'
  | 'tags'
  | 'prep_time'
  | 'cook_time'
  | 'total_time'
  | 'servings'
  | 'difficulty'
  | 'rating_avg'
  | 'rating_count'
  | 'published_at'
> & { author_name: string; author_slug: string };

const LIST_COLS = {
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
} as const;

export async function getRecipeBySlug(slug: string): Promise<RecipeWithAuthor | null> {
  const rows = await db
    .select({ recipe: recipes, author: authors })
    .from(recipes)
    .innerJoin(authors, eq(recipes.author_id, authors.id))
    .where(and(eq(recipes.slug, slug), eq(recipes.status, 'published')))
    .limit(1);
  if (!rows[0]) return null;
  return { ...rows[0].recipe, author: rows[0].author };
}

export async function listAllPublishedSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: recipes.slug }).from(recipes).where(eq(recipes.status, 'published'));
  return rows.map((r) => r.slug);
}

export async function listRecipes(opts: {
  categorySlug?: string;
  cuisineSlug?: string;
  dietTag?: string;
  authorSlug?: string;
  excludeId?: number;
  limit?: number;
  offset?: number;
} = {}): Promise<RecipeListItem[]> {
  const { categorySlug, cuisineSlug, dietTag, authorSlug, excludeId, limit = 24, offset = 0 } = opts;

  const conds = [eq(recipes.status, 'published')];
  if (categorySlug) conds.push(eq(recipes.category_slug, categorySlug));
  if (cuisineSlug) conds.push(eq(recipes.cuisine_slug, cuisineSlug));
  if (dietTag) conds.push(sql`${dietTag} = ANY(${recipes.diet_tags})`);
  if (authorSlug) conds.push(eq(authors.slug, authorSlug));
  if (excludeId) conds.push(ne(recipes.id, excludeId));

  return db
    .select(LIST_COLS)
    .from(recipes)
    .innerJoin(authors, eq(recipes.author_id, authors.id))
    .where(and(...conds))
    .orderBy(desc(recipes.published_at), desc(recipes.id))
    .limit(limit)
    .offset(offset);
}

export async function listFeaturedRecipes(limit = 6): Promise<RecipeListItem[]> {
  return db
    .select(LIST_COLS)
    .from(recipes)
    .innerJoin(authors, eq(recipes.author_id, authors.id))
    .where(and(eq(recipes.status, 'published'), or(eq(recipes.is_featured, true), eq(recipes.status, 'published'))))
    .orderBy(desc(recipes.is_featured), desc(recipes.published_at))
    .limit(limit);
}

export async function listLatestRecipes(limit = 12): Promise<RecipeListItem[]> {
  return db
    .select(LIST_COLS)
    .from(recipes)
    .innerJoin(authors, eq(recipes.author_id, authors.id))
    .where(eq(recipes.status, 'published'))
    .orderBy(desc(recipes.published_at), desc(recipes.id))
    .limit(limit);
}

export async function listRelatedRecipes(recipe: Recipe, limit = 4): Promise<RecipeListItem[]> {
  return db
    .select(LIST_COLS)
    .from(recipes)
    .innerJoin(authors, eq(recipes.author_id, authors.id))
    .where(
      and(
        eq(recipes.status, 'published'),
        eq(recipes.category_slug, recipe.category_slug),
        ne(recipes.id, recipe.id),
      ),
    )
    .orderBy(desc(recipes.published_at))
    .limit(limit);
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row ?? null;
}

export async function getCuisineBySlug(slug: string) {
  const [row] = await db.select().from(cuisines).where(eq(cuisines.slug, slug)).limit(1);
  return row ?? null;
}

export async function listCategoriesWithCounts() {
  const [cats, counts] = await Promise.all([
    db
      .select({
        slug: categories.slug,
        name_pl: categories.name_pl,
        description: categories.description,
        sort_order: categories.sort_order,
      })
      .from(categories)
      .orderBy(categories.sort_order),
    db
      .select({
        category_slug: recipes.category_slug,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(recipes)
      .where(eq(recipes.status, 'published'))
      .groupBy(recipes.category_slug),
  ]);
  const countBySlug = new Map(counts.map((c) => [c.category_slug, Number(c.count)]));
  return cats.map((c) => ({ ...c, count: countBySlug.get(c.slug) ?? 0 }));
}
