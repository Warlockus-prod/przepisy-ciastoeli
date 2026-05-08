import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { isResponse, requireRole } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { recipes } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const IngredientSchema = z.object({
  raw: z.string(),
  amount: z.number().nullable(),
  unit: z.string().nullable(),
  name: z.string(),
  optional: z.boolean().optional(),
  group: z.string().optional(),
});

const InstructionSchema = z.object({
  step: z.number(),
  text: z.string(),
  image_url: z.string().optional(),
  image_alt: z.string().optional(),
  tip: z.string().optional(),
  duration_minutes: z.number().optional(),
  temperature_c: z.number().optional(),
});

const CreateSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().min(1),
  hero_image_url: z.string().min(1),
  hero_image_alt: z.string().min(1),
  category_slug: z.string().min(1),
  cuisine_slug: z.string().nullable().optional(),
  prep_time: z.number().int().min(0).nullable().optional(),
  cook_time: z.number().int().min(0).nullable().optional(),
  total_time: z.number().int().min(0).nullable().optional(),
  servings: z.number().int().min(1).max(100).default(1),
  difficulty: z.enum(['łatwy', 'średni', 'trudny']).nullable().optional(),
  author_id: z.number().int(),
  ingredients: z.array(IngredientSchema).min(1),
  instructions: z.array(InstructionSchema).min(1),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  diet_tags: z.array(z.string()).default([]),
  source: z
    .enum(['telegram', 'admin-url', 'admin-photo', 'admin-manual', 'batch-import', 'seed'])
    .default('admin-manual'),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
});

export async function POST(req: Request) {
  const auth = await requireRole('editor');
  if (isResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', details: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;
  try {
    const [created] = await db
      .insert(recipes)
      .values({
        ...data,
        published_at: data.status === 'published' ? new Date() : null,
      })
      .returning();

    if (created.status === 'published') {
      revalidatePath('/');
      revalidatePath(`/przepisy/${created.slug}`);
      revalidatePath(`/kategoria/${created.category_slug}`);
    }

    return NextResponse.json({ ok: true, recipe: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'db error';
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Slug już istnieje. Wybierz inny.' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
