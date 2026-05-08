import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const start = Date.now();
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const t0 = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (err) {
    dbError = (err as Error).message;
  }

  const body = {
    status: dbOk ? 'ok' : 'degraded',
    service: 'przepisy.ciastoeli.pl',
    timestamp: new Date().toISOString(),
    uptime_s: Math.round(process.uptime()),
    db: { ok: dbOk, latency_ms: dbLatencyMs, error: dbError },
    response_ms: Date.now() - start,
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
