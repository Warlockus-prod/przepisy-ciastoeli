import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Check .env.local or .env.production.');
}

declare global {
  // Reuse connection across Next.js dev hot-reloads to avoid pool exhaustion
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__pgClient ??
  postgres(connectionString, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 5,
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__pgClient = client;
}

export const db = drizzle(client, { schema, casing: 'snake_case' });
export { schema };
