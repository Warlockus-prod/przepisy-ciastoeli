import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { isResponse, requireRole } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { recipeRatings, recipes } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PatchSchema = z.object({
  action: z.enum(['approve', 'reject', 'spam']),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('admin');
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const ratingId = parseInt(id, 10);
  if (Number.isNaN(ratingId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid action' }, { status: 400 });

  const set =
    parsed.data.action === 'approve'
      ? { is_approved: true, is_spam: false }
      : parsed.data.action === 'spam'
        ? { is_approved: false, is_spam: true }
        : { is_approved: false, is_spam: false };

  const [updated] = await db
    .update(recipeRatings)
    .set(set)
    .where(eq(recipeRatings.id, ratingId))
    .returning({ recipe_id: recipeRatings.recipe_id });

  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Aggregate trigger fires automatically; revalidate recipe page
  const [rec] = await db
    .select({ slug: recipes.slug })
    .from(recipes)
    .where(eq(recipes.id, updated.recipe_id))
    .limit(1);
  if (rec) revalidatePath(`/przepisy/${rec.slug}`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('admin');
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const ratingId = parseInt(id, 10);
  if (Number.isNaN(ratingId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const [deleted] = await db
    .delete(recipeRatings)
    .where(eq(recipeRatings.id, ratingId))
    .returning({ recipe_id: recipeRatings.recipe_id });
  if (!deleted) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
