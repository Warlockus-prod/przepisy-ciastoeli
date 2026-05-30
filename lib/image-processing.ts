import 'server-only';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import sharp from 'sharp';

const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? (process.env.NODE_ENV === 'production' ? '/app/data/uploads' : './uploads');

export type ProcessedImage = {
  hero: string; // 1200x800 webp (public path)
  square: string; // 1200x1200 webp
  og: string; // 1200x630 webp
  card: string; // 800x533 webp
  width: number;
  height: number;
};

/**
 * Generate responsive WebP variants from a source buffer.
 * Writes to /uploads/recipes/{slug}/{variant}.webp and returns public paths.
 *
 * These are served directly by nginx (unoptimized in next/image), so we
 * pre-bake the sizes Google wants (hero 16:10, square 1:1 for Discover, og 1.91:1).
 */
export async function generateRecipeVariants(source: Buffer, slug: string): Promise<ProcessedImage> {
  const baseDir = join(UPLOADS_DIR, 'recipes', slug);
  await mkdir(baseDir, { recursive: true });

  const meta = await sharp(source).metadata();

  const variants: Array<{ name: keyof Omit<ProcessedImage, 'width' | 'height'>; w: number; h: number }> = [
    { name: 'hero', w: 1200, h: 800 },
    { name: 'square', w: 1200, h: 1200 },
    { name: 'og', w: 1200, h: 630 },
    { name: 'card', w: 800, h: 533 },
  ];

  const out = {} as ProcessedImage;
  for (const v of variants) {
    const buf = await sharp(source)
      .resize(v.w, v.h, { fit: 'cover', position: 'attention' })
      .webp({ quality: 82 })
      .toBuffer();
    const file = join(baseDir, `${v.name}.webp`);
    await writeFile(file, buf);
    out[v.name] = `/uploads/recipes/${slug}/${v.name}.webp`;
  }

  out.width = meta.width ?? 1200;
  out.height = meta.height ?? 800;
  return out;
}

/**
 * Process a single uploaded image into a WebP at given max width.
 * Returns the public path.
 */
export async function processUploadToWebp(source: Buffer, relPath: string, maxWidth = 1600): Promise<string> {
  const full = join(UPLOADS_DIR, relPath);
  await mkdir(dirname(full), { recursive: true });
  const buf = await sharp(source)
    .resize(maxWidth, null, { withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  await writeFile(full, buf);
  return `/uploads/${relPath}`;
}
