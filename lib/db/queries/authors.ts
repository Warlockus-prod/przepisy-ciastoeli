import 'server-only';
import { eq } from 'drizzle-orm';

import { db } from '../client';
import { authors } from '../schema';

export async function getAuthorBySlug(slug: string) {
  const [row] = await db.select().from(authors).where(eq(authors.slug, slug)).limit(1);
  return row ?? null;
}

export async function getPrimaryAuthor() {
  const [row] = await db.select().from(authors).where(eq(authors.is_primary, true)).limit(1);
  return row ?? null;
}

export async function listAuthors() {
  return db.select().from(authors).where(eq(authors.is_active, true)).orderBy(authors.name);
}
