import 'server-only';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { images } from '@/lib/db/schema';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? (process.env.NODE_ENV === 'production' ? '/app/data/uploads' : './uploads');
const PUBLIC_PATH = '/uploads';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const MAGIC = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF + later 'WEBP'
};

export class UploadError extends Error {
  constructor(public status: number, msg: string) {
    super(msg);
  }
}

function magicMatches(buf: Uint8Array, magic: number[]): boolean {
  return magic.every((b, i) => buf[i] === b);
}

function detectMime(buf: Uint8Array): string | null {
  if (magicMatches(buf, MAGIC.jpeg)) return 'image/jpeg';
  if (magicMatches(buf, MAGIC.png)) return 'image/png';
  if (
    magicMatches(buf, MAGIC.webp) &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50 // 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export type UploadResult = {
  id: number;
  url: string;
  filename: string;
  mime: string;
  bytes: number;
};

/**
 * Persist uploaded image:
 *   1. Validate magic bytes (not just MIME header)
 *   2. Check size
 *   3. Save to /uploads/manual/{uuid}.{ext}
 *   4. Insert into `images` table
 */
export async function persistUpload(file: File, opts: { alt?: string; recipe_id?: number; keywords?: string[] } = {}): Promise<UploadResult> {
  if (file.size > MAX_BYTES) throw new UploadError(413, `File too large (${file.size} > ${MAX_BYTES})`);

  const buf = Buffer.from(await file.arrayBuffer());
  const sniffed = detectMime(buf);
  if (!sniffed) throw new UploadError(415, 'Invalid image bytes (magic check failed)');
  if (!ALLOWED_MIME.has(sniffed)) throw new UploadError(415, `Unsupported MIME: ${sniffed}`);

  const ext = sniffed === 'image/jpeg' ? 'jpg' : sniffed === 'image/png' ? 'png' : 'webp';
  const dir = join(UPLOADS_DIR, 'manual');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const id = crypto.randomUUID();
  const filename = `${id}.${ext}`;
  const localPath = join(dir, filename);

  await pipeline(Readable.from(buf), createWriteStream(localPath));

  const url = `${PUBLIC_PATH}/manual/${filename}`;
  const [row] = await db
    .insert(images)
    .values({
      url,
      alt: opts.alt ?? '',
      source: 'upload',
      keywords: opts.keywords ?? [],
      width: null,
      height: null,
      bytes: buf.length,
      recipe_id: opts.recipe_id ?? null,
    })
    .returning({ id: images.id });

  return { id: row.id, url, filename, mime: sniffed, bytes: buf.length };
}
