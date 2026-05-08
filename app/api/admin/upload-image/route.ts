import { NextResponse } from 'next/server';

import { isResponse, requireRole } from '@/lib/auth/server';
import { persistUpload, UploadError } from '@/lib/uploads';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  const auth = await requireRole('editor');
  if (isResponse(auth)) return auth;

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Bad form data' }, { status: 400 });

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const alt = (formData.get('alt') as string | null)?.slice(0, 200) ?? '';
  const keywordsRaw = (formData.get('keywords') as string | null) ?? '';
  const keywords = keywordsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  const recipeIdRaw = formData.get('recipe_id') as string | null;
  const recipe_id = recipeIdRaw ? parseInt(recipeIdRaw, 10) : undefined;

  try {
    const result = await persistUpload(file, { alt, keywords, recipe_id });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message ?? 'upload failed' }, { status: 500 });
  }
}
