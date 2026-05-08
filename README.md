# przepisy.ciastoeli.pl

Premium polski portal kulinarny. Domowe wypieki, smak premium.

**Stack:** Next.js 16 + React 19 + TypeScript + Drizzle ORM + Postgres 16 + Tailwind v4

## Local development

```bash
# 1. Install
npm ci

# 2. Start postgres (Docker)
npm run db:up

# 3. Apply migrations + extensions
npm run db:migrate
npm run db:setup-extensions

# 4. Seed data (7 authors + 31 recipes + taxonomy)
npm run db:seed

# 5. Run dev
npm run dev          # → http://localhost:4310
```

Login (admin):
- URL: http://localhost:4310/admin/login
- email/password from `.env.local` (`ADMIN_OWNER_EMAILS` + `ADMIN_PASSWORD`)

## Production

See [DEPLOY.md](DEPLOY.md) for VPS deployment instructions.

## Architecture

See [BLUEPRINT.md](BLUEPRINT.md) for the full architecture document.
