#!/usr/bin/env bash
# Install backup cron on VPS — run once after first deploy.
#
# Usage on VPS:
#   bash /opt/repos/przepisy/scripts/install-cron-backup.sh
#
# Backups go to /root/backups/ — pg_dump every night at 03:00,
# uploads tarball every night at 03:30, retention 30 days.

set -e

mkdir -p /root/backups

cat > /etc/cron.d/przepisy-backup <<'EOF'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=""

# pg_dump every night
0 3 * * * root docker exec przepisy-postgres pg_dump -U przepisy przepisy 2>/dev/null | gzip > /root/backups/przepisy-pg-$(date +\%F).sql.gz

# uploads tarball
30 3 * * * root tar -czf /root/backups/przepisy-uploads-$(date +\%F).tgz -C /opt/repos/przepisy uploads 2>/dev/null

# retention: 30 days
0 4 * * * root find /root/backups -name 'przepisy-*' -mtime +30 -delete
EOF

chmod 644 /etc/cron.d/przepisy-backup
systemctl reload cron 2>/dev/null || service cron reload 2>/dev/null || true

echo "✓ /etc/cron.d/przepisy-backup installed"
echo "✓ next backup at 03:00 (pg) + 03:30 (uploads)"
echo "✓ retention 30 days"
echo
echo "to test now:"
echo "  docker exec przepisy-postgres pg_dump -U przepisy przepisy | gzip > /tmp/test.sql.gz && ls -la /tmp/test.sql.gz"
