import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createRating, hashIp } from '@/lib/db/queries/ratings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = ipBuckets.get(ip);
  if (!b || now > b.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_LIMIT_MAX) return false;
  b.count++;
  return true;
}

const RatingInputSchema = z.object({
  recipe_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).nullable().optional(),
  author_name: z.string().min(1).max(100),
  author_email: z.string().email().max(255).nullable().optional(),
});

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return '0.0.0.0';
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON.' }, { status: 400 });
  }

  const parsed = RatingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowe dane.', details: parsed.error.format() }, { status: 400 });
  }

  try {
    const { id, verification_token } = await createRating({
      ...parsed.data,
      ip_hash: hashIp(ip),
      user_agent: req.headers.get('user-agent') ?? null,
    });

    if (verification_token) {
      // TODO: send verification email when Resend is wired in.
      // For now log the token for dev.
      if (process.env.NODE_ENV !== 'production') {
        const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4310'}/api/public/ratings/verify?token=${verification_token}`;
        console.log('🔑 Email verification link:', verifyUrl);
      }
    }

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Błąd serwera.';
    if (msg.includes('Już oceniłeś')) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
