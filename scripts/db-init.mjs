// Production DB initialization: migrations + extensions + trigger.
// Idempotent — safe to run on every deploy.
// Used by `migrate` service in docker-compose.yml.

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
const db = drizzle(sql);

try {
  console.log('🔧 Applying Drizzle migrations...');
  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  console.log('✅ Migrations applied');

  console.log('🔧 Setting up extensions...');
  await sql`CREATE EXTENSION IF NOT EXISTS unaccent`;

  console.log('🔧 Creating rating-aggregate function...');
  await sql`
    CREATE OR REPLACE FUNCTION refresh_recipe_rating_aggregates(p_recipe_id INTEGER) RETURNS void AS $$
    BEGIN
      UPDATE recipes SET
        rating_count = (SELECT COUNT(*)::int FROM recipe_ratings WHERE recipe_id = p_recipe_id AND is_approved = true),
        rating_avg = (SELECT ROUND(AVG(rating) * 10)::int FROM recipe_ratings WHERE recipe_id = p_recipe_id AND is_approved = true)
      WHERE id = p_recipe_id;
    END;
    $$ LANGUAGE plpgsql;
  `;

  console.log('🔧 Creating rating trigger...');
  await sql`
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
  `;
  await sql`DROP TRIGGER IF EXISTS recipe_ratings_aggregate ON recipe_ratings`;
  await sql`
    CREATE TRIGGER recipe_ratings_aggregate
    AFTER INSERT OR UPDATE OR DELETE ON recipe_ratings
    FOR EACH ROW EXECUTE FUNCTION recipe_ratings_aggregate_trigger()
  `;

  console.log('✅ DB init complete');
} catch (err) {
  console.error('❌ db-init failed:', err);
  process.exit(1);
} finally {
  await sql.end();
}
