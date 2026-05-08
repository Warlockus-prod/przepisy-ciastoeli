import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isResponse, requireRole } from '@/lib/auth/server';
import { isOpenAIAvailable } from '@/lib/ai/client';
import { rewriteRecipe } from '@/lib/ai/recipe-rewriter';
import { extractRecipeFromHtml } from '@/lib/parsers/jsonld-extractor';
import { fetchHtml } from '@/lib/parsers/url-fetcher';
import { parseIngredientLine, buildInstructions } from '@/lib/parsers/ingredient-normalizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const InputSchema = z.object({
  url: z.string().url().max(2048),
  use_ai: z.boolean().optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole('editor');
  if (isResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const useAI = parsed.data.use_ai ?? true;

  let html;
  try {
    html = await fetchHtml(parsed.data.url);
  } catch (err) {
    return NextResponse.json(
      { error: 'fetch failed', detail: (err as Error).message },
      { status: 422 },
    );
  }

  const extracted = extractRecipeFromHtml(html.html, html.finalUrl);
  if (!extracted) {
    return NextResponse.json(
      { error: 'extraction failed', detail: 'No JSON-LD Recipe and HTML heuristic returned nothing' },
      { status: 422 },
    );
  }

  const rewriteAvailable = useAI && isOpenAIAvailable();

  if (rewriteAvailable) {
    try {
      const rewritten = await rewriteRecipe({ source_url: html.finalUrl, extracted });
      if (rewritten) {
        return NextResponse.json({
          ok: true,
          mode: 'ai-rewritten',
          source_url: html.finalUrl,
          extracted_method: extracted.source,
          recipe: rewritten,
        });
      }
    } catch (err) {
      // Fall through to extracted-only mode
      console.error('[parse-url] AI rewrite failed, falling back:', err);
    }
  }

  // Fallback: convert extracted into draft form (no AI rewrite)
  const ingredients = extracted.ingredients.map(parseIngredientLine);
  const instructions = buildInstructions(extracted.instructions);

  return NextResponse.json({
    ok: true,
    mode: rewriteAvailable ? 'ai-failed-fallback' : 'extracted-only',
    source_url: html.finalUrl,
    extracted_method: extracted.source,
    recipe: {
      title: extracted.title,
      description: extracted.description || `${extracted.title} — przepis ze źródła ${html.finalUrl}.`,
      hero_image_url: extracted.image_url,
      ingredients,
      instructions,
      servings: extracted.servings ?? 4,
      prep_time: extracted.prep_time_minutes,
      cook_time: extracted.cook_time_minutes,
      tags: extracted.keywords.slice(0, 7),
      diet_tags: [],
      // category/cuisine come from heuristic — admin can override
      category_hint: extracted.category,
      cuisine_hint: extracted.cuisine,
      author_hint: extracted.author,
    },
    notes_to_admin: rewriteAvailable
      ? 'AI rewrite was attempted but failed — extracted source data shown below. Set OPENAI_API_KEY and retry, or fill manually.'
      : 'OPENAI_API_KEY not set — using direct extraction. Set the key in .env.production for AI rewrite + better SEO output.',
  });
}
