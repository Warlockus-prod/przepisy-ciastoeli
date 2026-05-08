import 'server-only';
import { NextResponse } from 'next/server';

import { getCurrentSession, type AdminSession } from './admin-auth';
import { meetsRole, type Role } from './rbac';

export async function requireRole(required: Role): Promise<AdminSession | NextResponse> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!meetsRole(session.role, required)) {
    return NextResponse.json({ error: 'forbidden', required, actual: session.role }, { status: 403 });
  }
  return session;
}

export function isResponse(x: AdminSession | NextResponse): x is NextResponse {
  return x instanceof NextResponse;
}
