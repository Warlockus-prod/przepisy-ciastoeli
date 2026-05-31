import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { isResponse, requireRole } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { authors, recipes } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(100).optional(),
  bio: z.string().min(1).optional(),
  bio_short: z.string().min(1).max(200).optional(),
  photo_url: z.string().nullable().optional(),
  specialty: z.array(z.string()).optional(),
  expertise_years: z.number().int().min(0).max(80).nullable().optional(),
  social_links: z.record(z.string(), z.string()).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  is_active: z.boolean().optional(),
  is_primary: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('admin');
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const authorId = parseInt(id, 10);
  if (Number.isNaN(authorId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', details: parsed.error.format() }, { status: 400 });
  }

  // Only one primary author at a time
  if (parsed.data.is_primary === true) {
    await db.update(authors).set({ is_primary: false }).where(eq(authors.is_primary, true));
  }

  const [updated] = await db
    .update(authors)
    .set({ ...parsed.data, updated_at: new Date() })
    .where(eq(authors.id, authorId))
    .returning();
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });

  revalidatePath(`/autor/${updated.slug}`);
  revalidatePath('/o-nas');
  return NextResponse.json({ ok: true, author: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('admin');
  if (isResponse(auth)) return auth;

  const { id } = await ctx.params;
  const authorId = parseInt(id, 10);
  if (Number.isNaN(authorId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  // Guard: don't delete an author who still has recipes
  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(recipes)
    .where(eq(recipes.author_id, authorId));
  if (Number(cnt) > 0) {
    return NextResponse.json(
      { error: `Autor ma ${cnt} przepisów. Przepisz je najpierw na innego autora.` },
      { status: 409 },
    );
  }

  const [deleted] = await db.delete(authors).where(eq(authors.id, authorId)).returning({ slug: authors.slug });
  if (!deleted) return NextResponse.json({ error: 'not found' }, { status: 404 });
  revalidatePath('/o-nas');
  return NextResponse.json({ ok: true });
}
