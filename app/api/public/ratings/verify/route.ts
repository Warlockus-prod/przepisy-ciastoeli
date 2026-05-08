import { NextResponse } from 'next/server';

import { verifyRatingEmail } from '@/lib/db/queries/ratings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token || token.length !== 64) {
    return NextResponse.redirect(new URL('/?verify=invalid', url));
  }

  const ok = await verifyRatingEmail(token);
  return NextResponse.redirect(new URL(ok ? '/?verify=ok' : '/?verify=expired', url));
}
