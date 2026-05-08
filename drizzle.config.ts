import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://przepisy:dev_password_change_me@localhost:5435/przepisy',
  },
  verbose: true,
  strict: true,
});
