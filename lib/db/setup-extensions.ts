import { sql } from 'drizzle-orm';

import { db } from './client';

/**
 * Idempotent DB setup: extensions + triggers.
 * Run once after migrations. Safe to re-run.
 */
export async function setupDbExtensions() {
  console.log('🔧 Setting up extensions and triggers...');

  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent`);

  await db.execute(sql`
    CREATE OR REPLACE FUNCTION refresh_recipe_rating_aggregates(p_recipe_id INTEGER) RETURNS void AS $$
    BEGIN
      UPDATE recipes SET
        rating_count = (SELECT COUNT(*)::int FROM recipe_ratings WHERE recipe_id = p_recipe_id AND is_approved = true),
        rating_avg = (SELECT ROUND(AVG(rating) * 10)::int FROM recipe_ratings WHERE recipe_id = p_recipe_id AND is_approved = true)
      WHERE id = p_recipe_id;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await db.execute(sql`
    CREATE OR REPLACE FUNCTION recipe_ratings_aggregate_trigger() RETURNS TRIGGER AS $$
    BEGIN
      IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        PERFORM refresh_recipe_rating_aggregates(NEW.recipe_id);
        IF (TG_OP = 'UPDATE' AND NEW.recipe_id <> OLD.recipe_id) THEN
          PERFORM refresh_recipe_rating_aggregates(OLD.recipe_id);
        END IF;
      ELSIF (TG_OP = 'DELETE') THEN
        PERFORM refresh_recipe_rating_aggregates(OLD.recipe_id);
      END IF;
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql;
  `);

  await db.execute(sql`DROP TRIGGER IF EXISTS recipe_ratings_aggregate ON recipe_ratings`);
  await db.execute(sql`
    CREATE TRIGGER recipe_ratings_aggregate
    AFTER INSERT OR UPDATE OR DELETE ON recipe_ratings
    FOR EACH ROW EXECUTE FUNCTION recipe_ratings_aggregate_trigger();
  `);

  console.log('✅ Extensions + triggers ready');
}

if (require.main === module) {
  setupDbExtensions()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
