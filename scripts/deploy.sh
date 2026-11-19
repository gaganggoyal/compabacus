#!/usr/bin/env bash
# Deploys this working tree to the VPS: upload, install, build, update the database schema, restart.
#   ./scripts/deploy.sh            (uses root@161.97.97.34)
#   DEPLOY_HOST=root@1.2.3.4 ./scripts/deploy.sh
# One-time server setup (user, folders, env file, systemd, Caddy, firewall) is described in README.md.
set -euo pipefail

HOST="${DEPLOY_HOST:-root@161.97.97.34}"
APP=/var/www/kudoscup
# Keep-alives: a long, quiet build must not let the network silently drop the connection
# (the deploy then finishes on the server but this script waits forever).
SSH="ssh -o ServerAliveInterval=20 -o ServerAliveCountMax=6"
cd "$(dirname "$0")/.."

echo "→ uploading to $HOST:$APP"
rsync -az --delete -e "$SSH" \
  --exclude .git --exclude node_modules --exclude .next \
  --exclude '.env*' --exclude 'local.db*' --exclude '*.db' --exclude '*.db-*' \
  --exclude .DS_Store --exclude drizzle --exclude .npm --exclude .cache --exclude .config \
  ./ "$HOST:$APP/"

echo "→ installing, building and restarting on the server"
$SSH "$HOST" bash -s <<'REMOTE'
set -euo pipefail
APP=/var/www/kudoscup
chown -R kudoscup:kudoscup "$APP"
cd "$APP"
sudo -u kudoscup -H npm ci --no-audit --no-fund --loglevel=error
# Schema first: the build prerenders pages that read the database, so new tables/columns must exist before it.
# drizzle-kit push only adds here; it refuses (and stops the deploy) if a change would lose data.
sudo -u kudoscup -H bash -c 'set -a; . ./.env.production.local; set +a; npx drizzle-kit push'
sudo -u kudoscup -H npm run build
mkdir -p "$APP/.next/cache" && chown -R kudoscup:kudoscup "$APP/.next"
systemctl reset-failed kudoscup 2>/dev/null || true
systemctl restart kudoscup
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3400/; then echo "✓ kudoscup is up"; exit 0; fi
  sleep 1
done
echo "✗ kudoscup did not come up — see: journalctl -u kudoscup -n 50" >&2
exit 1
REMOTE
