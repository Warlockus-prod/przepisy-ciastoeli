import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isResponse, requireRole } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { authors } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CreateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'slug: tylko a-z, 0-9, myślnik'),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  bio: z.string().min(1),
  bio_short: z.string().min(1).max(200),
  photo_url: z.string().nullable().optional(),
  specialty: z.array(z.string()).default([]),
  expertise_years: z.number().int().min(0).max(80).nullable().optional(),
  social_links: z.record(z.string(), z.string()).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  is_active: z.boolean().default(true),
});

export async function POST(req: Request) {
  const auth = await requireRole('admin');
  if (isResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const [created] = await db.insert(authors).values(parsed.data).returning();
    return NextResponse.json({ ok: true, author: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'db error';
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Slug już istnieje.' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
