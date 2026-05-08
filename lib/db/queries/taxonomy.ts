import 'server-only';
import { eq, sql } from 'drizzle-orm';

import { db } from '../client';
import { categories, cuisines, dietTags } from '../schema';

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row ?? null;
}

export async function getCuisineBySlug(slug: string) {
  const [row] = await db.select().from(cuisines).where(eq(cuisines.slug, slug)).limit(1);
  return row ?? null;
}

export async function getDietTagBySlug(slug: string) {
  const [row] = await db.select().from(dietTags).where(eq(dietTags.slug, slug)).limit(1);
  return row ?? null;
}

export async function listAllCategorySlugs() {
  const rows = await db.select({ slug: categories.slug }).from(categories);
  return rows.map((r) => r.slug);
}

export async function listAllCuisineSlugs() {
  const rows = await db.select({ slug: cuisines.slug }).from(cuisines);
  return rows.map((r) => r.slug);
}

export async function listAllDietTagSlugs() {
  const rows = await db.select({ slug: dietTags.slug }).from(dietTags);
  return rows.map((r) => r.slug);
}

export async function listCuisinesWithCounts() {
  return db
    .select({
      slug: cuisines.slug,
      name_pl: cuisines.name_pl,
      sort_order: cuisines.sort_order,
      count: sql<number>`COALESCE((SELECT COUNT(*)::int FROM recipes r WHERE r.cuisine_slug = ${cuisines.slug} AND r.status='published'), 0)`,
    })
    .from(cuisines)
    .orderBy(cuisines.sort_order);
}

export async function listDietTagsWithCounts() {
  return db
    .select({
      slug: dietTags.slug,
      name_pl: dietTags.name_pl,
      icon: dietTags.icon,
      sort_order: dietTags.sort_order,
      count: sql<number>`COALESCE((SELECT COUNT(*)::int FROM recipes r WHERE ${dietTags.slug} = ANY(r.diet_tags) AND r.status='published'), 0)`,
    })
    .from(dietTags)
    .orderBy(dietTags.sort_order);
}
