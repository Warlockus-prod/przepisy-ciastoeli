// Download remote hero_image_url -> generate WebP variants (hero/square/og) via sharp
// -> update DB (hero_image_url, square_image_url, og_image_url) to local /uploads paths.
//
// Why: self-host images (no external CDN dependency / 404 risk), pre-bake the 3
// aspect ratios Google wants for Recipe.image (16:10 hero, 1:1 square for Discover,
// 1.91:1 og), and serve smaller WebP files via nginx (30d immutable cache).
//
// Run:
//   ssh root@VPS 'docker exec -e UPLOADS_DIR=/app/data/uploads przepisy-app node scripts/download-hero-images.mjs'
//
// Idempotent — skips recipes whose hero_image_url already points to /uploads/.
// Requires writable UPLOADS_DIR (chown 1001:1001 on first run).

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import postgres from 'postgres';
import sharp from 'sharp';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/app/data/uploads';
const PUBLIC = '/uploads';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
const sql = postgres(url, { max: 1 });

const VARIANTS = [
  { name: 'hero', w: 1200, h: 800 },
  { name: 'square', w: 1200, h: 1200 },
  { name: 'og', w: 1200, h: 630 },
  { name: 'card', w: 800, h: 533 },
];

async function loadSource(sourceUrl) {
  // Local /uploads path → read from disk (already-migrated jpg). Else fetch remote.
  if (sourceUrl.startsWith('/uploads/')) {
    const localPath = join(UPLOADS_DIR, sourceUrl.replace(/^\/uploads\//, ''));
    return Buffer.from(await readFile(localPath));
  }
  const res = await fetch(sourceUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
    headers: {
      'User-Agent': 'Mozilla/5.0 ciastoeli-image-downloader/1.0',
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processOne(slug, sourceUrl) {
  const source = await loadSource(sourceUrl);

  const dir = join(UPLOADS_DIR, 'recipes', slug);
  await mkdir(dir, { recursive: true });

  const out = {};
  for (const v of VARIANTS) {
    const buf = await sharp(source)
      .resize(v.w, v.h, { fit: 'cover', position: 'attention' })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(join(dir, `${v.name}.webp`), buf);
    out[v.name] = `${PUBLIC}/recipes/${slug}/${v.name}.webp`;
  }
  return { ok: true, ...out };
}

async function main() {
  const rows = await sql`SELECT id, slug, hero_image_url FROM recipes ORDER BY id`;
  console.log(`Processing ${rows.length} recipes...`);

  let done = 0,
    skipped = 0,
    failed = 0;

  for (const r of rows) {
    if (r.hero_image_url.includes('/uploads/') && r.hero_image_url.endsWith('.webp')) {
      skipped++;
      continue;
    }
    try {
      const result = await processOne(r.slug, r.hero_image_url);
      await sql`
        UPDATE recipes
        SET hero_image_url = ${result.hero},
            square_image_url = ${result.square},
            og_image_url = ${result.og},
            updated_at = NOW()
        WHERE id = ${r.id}
      `;
      console.log(`  ✓ ${r.slug}`);
      done++;
    } catch (e) {
      console.warn(`  ✗ ${r.slug}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${done} processed, ${skipped} already-local, ${failed} failed`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
