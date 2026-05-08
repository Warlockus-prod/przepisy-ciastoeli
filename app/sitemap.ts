import type { MetadataRoute } from 'next';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { authors, categories, cuisines, dietTags, recipes } from '@/lib/db/schema';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://przepisy.ciastoeli.pl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recipeRows, categoryRows, cuisineRows, dietRows, authorRows] = await Promise.all([
    db
      .select({ slug: recipes.slug, updated_at: recipes.updated_at })
      .from(recipes)
      .where(eq(recipes.status, 'published')),
    db.select({ slug: categories.slug }).from(categories),
    db.select({ slug: cuisines.slug }).from(cuisines),
    db.select({ slug: dietTags.slug }).from(dietTags),
    db.select({ slug: authors.slug }).from(authors).where(eq(authors.is_active, true)),
  ]);

  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/przepisy`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/o-nas`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/polityka-redakcyjna`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/kontakt`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const recipeUrls: MetadataRoute.Sitemap = recipeRows.map((r) => ({
    url: `${SITE_URL}/przepisy/${r.slug}`,
    lastModified: r.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categoryRows.map((c) => ({
    url: `${SITE_URL}/kategoria/${c.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const cuisineUrls: MetadataRoute.Sitemap = cuisineRows.map((c) => ({
    url: `${SITE_URL}/kuchnia/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const dietUrls: MetadataRoute.Sitemap = dietRows.map((d) => ({
    url: `${SITE_URL}/dieta/${d.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const authorUrls: MetadataRoute.Sitemap = authorRows.map((a) => ({
    url: `${SITE_URL}/autor/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...recipeUrls, ...categoryUrls, ...cuisineUrls, ...dietUrls, ...authorUrls];
}
