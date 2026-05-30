# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# GIT_SHA busts the build-cache layer per commit so `docker compose build` (without
# --no-cache) can never serve a stale bundle. deps layer above stays cached (fast).
ARG GIT_SHA=dev
RUN echo "build commit: ${GIT_SHA}" && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4310
ENV HOSTNAME=0.0.0.0

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/lib/db/migrations ./lib/db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/seed-recipes ./seed-recipes
# Standalone trace omits deps used only by scripts (migrate, image-processing) and
# native modules (sharp). Install them via npm so the full transitive tree resolves
# consistently. Done in one install so npm doesn't prune them as extraneous.
RUN npm install --no-save --omit=dev sharp@^0.34.5 postgres@^3.4.9 drizzle-orm@^0.45.2 && \
    chown -R nextjs:nodejs node_modules

USER nextjs
EXPOSE 4310

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS http://127.0.0.1:4310/api/health || exit 1

CMD ["node", "server.js"]
