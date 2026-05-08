import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { isResponse, requireRole } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { recipes } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PatchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  hero_image_url: z.string().url().optional(),
  hero_image_alt: z.string().min(1).optional(),
  category_slug: z.string().min(1).max(100).optional(),
  cuisine_slug: z.string().max(100).nullable().optional(),
  prep_time: z.number().int().min(0).nullable().optional(),
  cook_time: z.number().int().min(0).nullable().optional(),
  total_time: z.number().int().min(0).nullable().optional(),
  servings: z.number().int().min(1).max(100).optional(),
  difficulty: z.enum(['łatwy', 'średni', 'trudny']).nullable().optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  is_featured: z.boolean().optional(),
  is_news: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  author_id: z.number().int().optional(),
  meta_title: z.string().max(100).nullable().optional(),
  meta_description: z.string().max(200).nullable().optional(),
  diet_tags: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('editor');
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const recipeId = parseInt(id, 10);
  if (Number.isNaN(recipeId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', details: parsed.error.format() }, { status: 400 });
  }

  const updates = { ...parsed.data, updated_at: new Date() };

  // Auto-set published_at when transitioning to published
  if (parsed.data.status === 'published') {
    const [existing] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
    if (existing && !existing.published_at) {
      (updates as Record<string, unknown>).published_at = new Date();
    }
  }

  const [updated] = await db.update(recipes).set(updates).where(eq(recipes.id, recipeId)).returning();
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Revalidate
  revalidatePath('/');
  revalidatePath(`/przepisy/${updated.slug}`);
  revalidatePath(`/kategoria/${updated.category_slug}`);
  if (updated.cuisine_slug) revalidatePath(`/kuchnia/${updated.cuisine_slug}`);

  return NextResponse.json({ ok: true, recipe: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('admin');
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const recipeId = parseInt(id, 10);
  if (Number.isNaN(recipeId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const [deleted] = await db.delete(recipes).where(eq(recipes.id, recipeId)).returning({ slug: recipes.slug });
  if (!deleted) return NextResponse.json({ error: 'not found' }, { status: 404 });

  revalidatePath('/');
  revalidatePath('/przepisy');
  revalidatePath(`/przepisy/${deleted.slug}`);

  return NextResponse.json({ ok: true });
}
