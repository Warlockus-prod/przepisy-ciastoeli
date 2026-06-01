import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

import { isResponse, requireRole } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { recipes } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BulkSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500),
  action: z.enum(['publish', 'unpublish', 'archive', 'delete']),
});

export async function POST(req: Request) {
  // delete needs admin; status changes need editor
  const body = await req.json().catch(() => null);
  const parsed = BulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', details: parsed.error.format() }, { status: 400 });
  }

  const requiredRole = parsed.data.action === 'delete' ? 'admin' : 'editor';
  const auth = await requireRole(requiredRole);
  if (isResponse(auth)) return auth;

  const { ids, action } = parsed.data;

  let affected: { slug: string; category_slug: string }[] = [];

  if (action === 'delete') {
    affected = await db.delete(recipes).where(inArray(recipes.id, ids)).returning({
      slug: recipes.slug,
      category_slug: recipes.category_slug,
    });
  } else {
    const set =
      action === 'publish'
        ? { status: 'published' as const, published_at: new Date() }
        : action === 'unpublish'
          ? { status: 'draft' as const }
          : { status: 'archived' as const };
    affected = await db.update(recipes).set({ ...set, updated_at: new Date() }).where(inArray(recipes.id, ids)).returning({
      slug: recipes.slug,
      category_slug: recipes.category_slug,
    });
  }

  // Revalidate affected listing surfaces
  revalidatePath('/');
  revalidatePath('/przepisy');
  const cats = new Set(affected.map((a) => a.category_slug));
  for (const c of cats) revalidatePath(`/kategoria/${c}`);
  for (const a of affected) revalidatePath(`/przepisy/${a.slug}`);

  return NextResponse.json({ ok: true, affected: affected.length, action });
}
