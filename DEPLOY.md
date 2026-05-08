# Deploy guide — przepisy.ciastoeli.pl

Target: VPS #2 (Hetzner FSN1, `178.104.223.93`).

## Prerequisites

DNS:
- `A przepisy.ciastoeli.pl → 178.104.223.93` (already done)

VPS:
- Docker + docker-compose installed
- Shared `nginx_server` container running
- `/opt/repos/certs/` directory with SSL key/cert dirs
- `/var/www/certbot` for ACME challenges
- `certbot` installed with `--deploy-hook` to copy renewed certs

## First deploy

```bash
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@178.104.223.93
mkdir -p /opt/repos/przepisy
cd /opt/repos/przepisy
git clone https://github.com/Warlockus-prod/przepisy-ciastoeli.git .

# Create production env (NEVER commit)
cp .env.production.example .env.production
# Generate secrets
echo "Generated secrets:"
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
echo "ADMIN_PASSWORD=$(openssl rand -hex 24)"
echo "ADMIN_SESSION_SECRET=$(openssl rand -hex 32)"
echo "INTERNAL_SERVICE_TOKEN=$(openssl rand -hex 32)"
echo "RATING_IP_SALT=$(openssl rand -hex 24)"
# Edit .env.production with these + real ADMIN_OWNER_EMAILS
nano .env.production
# Sync DATABASE_URL with POSTGRES_USER/PASSWORD/DB

# Build + run
docker compose build
docker compose up -d --wait

# Apply DB migrations + extensions + seed
docker compose exec app sh -c "cd /app && npx tsx --env-file=/app/.env.production -e 'process.env.DATABASE_URL=process.env.DATABASE_URL' lib/db/setup-extensions.ts" || \
  echo "manual: pgsql exec migrations"

# Verify
curl -fsS http://172.17.0.1:4310/api/health
```

## Nginx vhost

```bash
# Copy vhost into nginx_server's bind-mounted conf.d
cp /opt/repos/przepisy/przepisy.nginx.conf \
   /opt/repos/nginx_server/conf.d/przepisy.conf

# Test + reload (NEVER restart nginx_server!)
docker exec nginx_server nginx -t
docker exec nginx_server nginx -s reload
```

## SSL via certbot

```bash
certbot certonly --webroot -w /var/www/certbot \
  -d przepisy.ciastoeli.pl -d www.przepisy.ciastoeli.pl \
  --deploy-hook /etc/letsencrypt/renewal-hooks/deploy/copy-to-shared-and-reload.sh

# Verify cert paths
ls -la /opt/repos/certs/certs/przepisy.ciastoeli.pl.crt
ls -la /opt/repos/certs/private/przepisy.ciastoeli.pl.key
```

After cert is issued, the shared deploy-hook copies it into `/opt/repos/certs/` and reloads `nginx_server`.

## Post-deploy verification

```bash
curl -fsS https://przepisy.ciastoeli.pl/api/health
curl -fsS https://przepisy.ciastoeli.pl/ | grep -o "<title>[^<]*"
curl -fsS https://przepisy.ciastoeli.pl/przepisy/szarlotka | head -1
curl -fsS https://przepisy.ciastoeli.pl/sitemap.xml | head -5
curl -fsS https://przepisy.ciastoeli.pl/robots.txt
```

## Updates

```bash
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@178.104.223.93
cd /opt/repos/przepisy
git pull
docker compose build app
docker compose up -d --wait
docker compose logs --tail 30 app
```

## Backups

```bash
# /etc/cron.d/przepisy-backup
0 3 * * * root docker exec przepisy-postgres pg_dump -U przepisy przepisy | gzip > /root/backups/przepisy-$(date +\%F).sql.gz
0 3 * * * root tar -czf /root/backups/przepisy-uploads-$(date +\%F).tgz /opt/repos/przepisy/uploads/ 2>/dev/null
0 4 * * * root find /root/backups -name 'przepisy-*' -mtime +30 -delete
```

## Rollback

```bash
cd /opt/repos/przepisy
git log --oneline -10
git checkout <previous-sha>
docker compose build app && docker compose up -d --wait
```
