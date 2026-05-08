import 'server-only';
import { and, desc, eq, sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';

import { db } from '../client';
import { recipeRatings, recipes } from '../schema';
import type { RecipeRating } from '../schema';

const IP_SALT = process.env.RATING_IP_SALT ?? 'dev_ip_salt_change_in_prod';

export function hashIp(ip: string): string {
  return createHash('sha256').update(`${ip}|${IP_SALT}`).digest('hex');
}

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export async function listApprovedRatings(recipeId: number, limit = 20): Promise<RecipeRating[]> {
  return db
    .select()
    .from(recipeRatings)
    .where(and(eq(recipeRatings.recipe_id, recipeId), eq(recipeRatings.is_approved, true)))
    .orderBy(desc(recipeRatings.created_at))
    .limit(limit);
}

export async function getRatingDistribution(recipeId: number): Promise<Record<1 | 2 | 3 | 4 | 5, number>> {
  const rows = await db
    .select({
      rating: recipeRatings.rating,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(recipeRatings)
    .where(and(eq(recipeRatings.recipe_id, recipeId), eq(recipeRatings.is_approved, true)))
    .groupBy(recipeRatings.rating);
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const r of rows) {
    if (r.rating >= 1 && r.rating <= 5) out[r.rating as 1 | 2 | 3 | 4 | 5] = Number(r.count);
  }
  return out;
}

export async function createRating(input: {
  recipe_id: number;
  rating: number;
  comment?: string | null;
  author_name: string;
  author_email?: string | null;
  ip_hash: string;
  user_agent?: string | null;
}): Promise<{ id: number; verification_token: string | null }> {
  const verification_token = input.author_email ? generateVerificationToken() : null;

  const [row] = await db
    .insert(recipeRatings)
    .values({
      recipe_id: input.recipe_id,
      rating: input.rating,
      comment: input.comment ?? null,
      author_name: input.author_name,
      author_email: input.author_email ?? null,
      verification_token,
      ip_hash: input.ip_hash,
      user_agent: input.user_agent ?? null,
      is_approved: false,
      email_verified: false,
    })
    .onConflictDoNothing({ target: [recipeRatings.recipe_id, recipeRatings.ip_hash] })
    .returning({ id: recipeRatings.id });

  if (!row) {
    throw new Error('Już oceniłeś ten przepis.');
  }
  return { id: row.id, verification_token };
}

export async function verifyRatingEmail(token: string): Promise<boolean> {
  const [row] = await db
    .update(recipeRatings)
    .set({ email_verified: true, verification_token: null })
    .where(eq(recipeRatings.verification_token, token))
    .returning({ id: recipeRatings.id });
  return Boolean(row);
}

/**
 * Refresh aggregates manually (called after approval).
 * In prod, a trigger handles this — but trigger creation is in setup SQL.
 */
export async function refreshRecipeAggregates(recipeId: number): Promise<void> {
  await db.execute(sql`
    UPDATE recipes SET
      rating_count = (SELECT COUNT(*)::int FROM recipe_ratings WHERE recipe_id = ${recipeId} AND is_approved = true),
      rating_avg = (SELECT ROUND(AVG(rating) * 10)::int FROM recipe_ratings WHERE recipe_id = ${recipeId} AND is_approved = true)
    WHERE id = ${recipeId}
  `);
}
