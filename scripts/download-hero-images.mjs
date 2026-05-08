// Download all remote hero_image_url'ы to local /uploads/recipes/{slug}/hero.{webp,jpg}
// and update DB rows to point to /uploads/recipes/{slug}/hero.{ext}.
//
// Goal: stop depending on cdn.aniagotuje.com / kwestiasmaku.com / unsplash.com
// for hero photos. After this:
//   - LCP более стабилен (наш CDN/nginx vs внешние)
//   - 30-day cache работает (см. nginx /uploads location)
//   - картинки никогда не 404'ятся внезапно
//
// Run once after seed:
//   tsx scripts/download-hero-images.mjs            # local dev (DB on localhost:5435)
//   ssh root@VPS 'docker compose exec migrate node scripts/download-hero-images.mjs'  # prod
//
// Idempotent — пропускает рецепты у которых hero_image_url уже /uploads/.

import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';
import postgres from 'postgres';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/app/data/uploads';
const PUBLIC_UPLOADS = '/uploads'; // нginx / Next /uploads

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function downloadOne(slug, sourceUrl) {
  const dir = join(UPLOADS_DIR, 'recipes', slug);
  mkdirSync(dir, { recursive: true });
  const ext = sourceUrl.match(/\.(jpg|jpeg|png|webp|avif)/i)?.[1]?.toLowerCase() ?? 'jpg';
  const localPath = join(dir, `hero.${ext}`);
  if (existsSync(localPath)) {
    return { ok: true, skipped: true, localUrl: `${PUBLIC_UPLOADS}/recipes/${slug}/hero.${ext}` };
  }
  const res = await fetch(sourceUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
    headers: {
      'User-Agent': 'Mozilla/5.0 ciastoeli-image-downloader/1.0',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok || !res.body) return { ok: false, status: res.status };
  await pipeline(res.body, createWriteStream(localPath));
  return { ok: true, skipped: false, localUrl: `${PUBLIC_UPLOADS}/recipes/${slug}/hero.${ext}` };
}

async function main() {
  const rows = await sql`SELECT id, slug, hero_image_url FROM recipes ORDER BY id`;
  console.log(`Processing ${rows.length} recipes...`);

  let downloaded = 0,
    skipped = 0,
    failed = 0,
    alreadyLocal = 0;

  for (const r of rows) {
    if (r.hero_image_url.startsWith('/uploads/')) {
      alreadyLocal++;
      continue;
    }
    try {
      const result = await downloadOne(r.slug, r.hero_image_url);
      if (!result.ok) {
        console.warn(`  ✗ ${r.slug} (status ${result.status})`);
        failed++;
        continue;
      }
      if (result.skipped) {
        skipped++;
      } else {
        downloaded++;
      }
      // Update DB
      await sql`UPDATE recipes SET hero_image_url = ${result.localUrl}, updated_at = NOW() WHERE id = ${r.id}`;
      console.log(`  ${result.skipped ? '↻' : '✓'} ${r.slug}`);
    } catch (e) {
      console.warn(`  ✗ ${r.slug}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${downloaded} downloaded, ${skipped} files-already, ${alreadyLocal} db-already, ${failed} failed`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
