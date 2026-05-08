import 'server-only';
import { count, eq, sql } from 'drizzle-orm';

import { db } from '../client';
import { activityLogs, authors, jobs, recipeRatings, recipes } from '../schema';

export async function getAdminStats() {
  const [recipeStats] = await db
    .select({
      total: count(),
      published: sql<number>`COUNT(*) FILTER (WHERE status = 'published')::int`,
      draft: sql<number>`COUNT(*) FILTER (WHERE status = 'draft')::int`,
      review: sql<number>`COUNT(*) FILTER (WHERE status = 'review')::int`,
    })
    .from(recipes);

  const [authorCount] = await db.select({ total: count() }).from(authors);
  const [pendingRatings] = await db
    .select({ total: count() })
    .from(recipeRatings)
    .where(eq(recipeRatings.is_approved, false));
  const [pendingJobs] = await db.select({ total: count() }).from(jobs).where(eq(jobs.status, 'pending'));

  return {
    recipes: recipeStats,
    authors: Number(authorCount?.total ?? 0),
    pendingRatings: Number(pendingRatings?.total ?? 0),
    pendingJobs: Number(pendingJobs?.total ?? 0),
  };
}

export async function getRecentActivity(limit = 20) {
  return db
    .select()
    .from(activityLogs)
    .orderBy(sql`${activityLogs.created_at} DESC`)
    .limit(limit);
}
