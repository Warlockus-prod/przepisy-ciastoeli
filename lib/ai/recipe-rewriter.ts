import { zodResponseFormat } from 'openai/helpers/zod';

import { getOpenAI, MODELS } from './client';
import { sanitizeForPrompt } from './prompt-injection-guard';
import { RECIPE_REWRITE_SYSTEM } from './prompts/recipe-rewrite.pl';
import { RecipeRewriteSchema, type RecipeRewrite } from './schemas';

import type { ExtractedRecipe } from '@/lib/parsers/jsonld-extractor';

export class OpenAIUnavailableError extends Error {
  constructor() {
    super('OPENAI_API_KEY is not set');
    this.name = 'OpenAIUnavailableError';
  }
}

export type RewriteInput = {
  source_url: string;
  extracted: ExtractedRecipe;
};

/**
 * Rewrite extracted recipe via GPT-4o into a clean Polish article.
 * Returns null if OPENAI_API_KEY is not configured.
 */
export async function rewriteRecipe(input: RewriteInput): Promise<RecipeRewrite | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const userText = formatExtractedForPrompt(input);
  const sanitized = sanitizeForPrompt(userText, 8000);

  const completion = await openai.chat.completions.create({
    model: MODELS.primary,
    temperature: 0.7,
    max_tokens: 4000,
    messages: [
      { role: 'system', content: RECIPE_REWRITE_SYSTEM },
      { role: 'user', content: sanitized },
    ],
    response_format: zodResponseFormat(RecipeRewriteSchema, 'recipe'),
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error('OpenAI returned empty response');

  const parsed = JSON.parse(content);
  return RecipeRewriteSchema.parse(parsed);
}

function formatExtractedForPrompt(input: RewriteInput): string {
  const e = input.extracted;
  const parts: string[] = [];
  parts.push(`Source URL: ${input.source_url}`);
  parts.push(`Source extraction method: ${e.source}`);
  if (e.title) parts.push(`Original title: ${e.title}`);
  if (e.description) parts.push(`Original description: ${e.description}`);
  if (e.author) parts.push(`Original author: ${e.author}`);
  if (e.category) parts.push(`Source category hint: ${e.category}`);
  if (e.cuisine) parts.push(`Source cuisine hint: ${e.cuisine}`);
  if (e.servings) parts.push(`Servings: ${e.servings}`);
  if (e.prep_time_minutes != null) parts.push(`Prep time: ${e.prep_time_minutes} min`);
  if (e.cook_time_minutes != null) parts.push(`Cook time: ${e.cook_time_minutes} min`);
  if (e.keywords.length) parts.push(`Keywords: ${e.keywords.join(', ')}`);

  if (e.ingredients.length) {
    parts.push('');
    parts.push('Ingredients:');
    parts.push(...e.ingredients.map((i) => `- ${i}`));
  }
  if (e.instructions.length) {
    parts.push('');
    parts.push('Instructions:');
    parts.push(...e.instructions.map((s, i) => `${i + 1}. ${s}`));
  }

  return parts.join('\n');
}
