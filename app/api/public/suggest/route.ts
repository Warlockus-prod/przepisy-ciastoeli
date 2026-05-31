import { NextResponse } from 'next/server';

import { searchRecipes } from '@/lib/db/queries/search';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const rows = await searchRecipes(q, { limit: 6, offset: 0 });
  const results = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    category_slug: r.category_slug,
    hero_image_url: r.hero_image_url,
    total_time: r.total_time,
  }));

  return NextResponse.json(
    { results },
    { headers: { 'cache-control': 's-maxage=60, stale-while-revalidate=300' } },
  );
}
