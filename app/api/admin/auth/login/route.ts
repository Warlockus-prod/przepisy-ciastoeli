import { NextResponse } from 'next/server';
import { z } from 'zod';

import { lookupRole, safeStringEqual, setSessionCookie } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const buckets = new Map<string, { count: number; resetAt: number }>();

function getIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '0.0.0.0';
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_LIMIT_MAX) return false;
  b.count++;
  return true;
}

const InputSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Zbyt wiele prób logowania. Spróbuj za 15 minut.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON.' }, { status: 400 });
  }

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD nie jest skonfigurowany.' }, { status: 500 });
  }
  if (!safeStringEqual(parsed.data.password, expected)) {
    return NextResponse.json({ error: 'Niepoprawny email lub hasło.' }, { status: 401 });
  }

  const role = await lookupRole(parsed.data.email);
  if (!role) {
    return NextResponse.json({ error: 'Niepoprawny email lub hasło.' }, { status: 401 });
  }

  await setSessionCookie({ email: parsed.data.email.toLowerCase(), role });
  return NextResponse.json({ ok: true, role });
}
