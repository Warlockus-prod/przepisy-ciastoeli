import { and, eq, gte } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { recipes } from '@/lib/db/schema';
import { safeBuildQuery } from '@/lib/db/safe';

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://przepisy.ciastoeli.pl';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'przepisy.ciastoeli.pl';

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET() {
  // 48h window per Google News spec
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const rows = await safeBuildQuery(
    db
      .select({
        slug: recipes.slug,
        title: recipes.title,
        published_at: recipes.published_at,
      })
      .from(recipes)
      .where(and(eq(recipes.status, 'published'), gte(recipes.published_at, cutoff)))
      .orderBy(recipes.published_at),
    [],
  );

  const urls = rows
    .filter((r) => r.published_at)
    .map(
      (r) => `  <url>
    <loc>${SITE_URL}/przepisy/${escape(r.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escape(SITE_NAME)}</news:name>
        <news:language>pl</news:language>
      </news:publication>
      <news:publication_date>${r.published_at!.toISOString()}</news:publication_date>
      <news:title>${escape(r.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=600, stale-while-revalidate=3600',
    },
  });
}
