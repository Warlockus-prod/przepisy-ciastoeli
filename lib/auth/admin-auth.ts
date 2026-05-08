import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { adminUsers } from '@/lib/db/schema';
import { SESSION_COOKIE, SESSION_TTL_MS } from './constants';
import { isOwnerEmail, type Role } from './rbac';

export { SESSION_COOKIE } from './constants';

type SessionPayload = {
  email: string;
  role: Role;
  exp: number;
};

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be set (min 32 chars)');
  }
  return s;
}

function sign(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token: string): SessionPayload | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expectedSig = createHmac('sha256', getSecret()).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function safeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export type AdminSession = SessionPayload;

export async function getCurrentSession(): Promise<AdminSession | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

export async function setSessionCookie(payload: Omit<SessionPayload, 'exp'>): Promise<void> {
  const exp = Date.now() + SESSION_TTL_MS;
  const token = sign({ ...payload, exp });
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

/**
 * Look up role for email. Auto-creates 'owner' for emails in ADMIN_OWNER_EMAILS.
 */
export async function lookupRole(email: string): Promise<Role | null> {
  const lower = email.toLowerCase().trim();
  if (isOwnerEmail(lower)) {
    // Ensure owner row exists
    await db
      .insert(adminUsers)
      .values({ email: lower, role: 'owner', is_active: true })
      .onConflictDoNothing();
    return 'owner';
  }
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, lower)).limit(1);
  if (!row || !row.is_active) return null;
  return row.role as Role;
}
