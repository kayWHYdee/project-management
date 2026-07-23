#!/usr/bin/env bash
#
# Nightly backup: dumps the whole uniquepm database to a timestamped .sql file
# in ./backups, then deletes dumps older than the retention window.
#
# Requires: the stack running (`docker compose up`), and a filled-in .env.
# Usage:    scripts/backup.sh            (run from anywhere; cd's to repo root)
#
set -euo pipefail

RETENTION_DAYS="${RETENTION_DAYS:-14}"

cd "$(dirname "$0")/.."
mkdir -p backups

# Load POSTGRES_USER / POSTGRES_DB from .env
set -a
# shellcheck disable=SC1091
source .env
set +a

stamp="$(date +%Y%m%d-%H%M%S)"
file="backups/uniquepm-${stamp}.sql"

# --clean --if-exists makes the dump self-restoring: it drops objects before
# recreating them, so a restore over an existing DB is safe.
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists >"$file"

echo "Backup written: $file ($(wc -c <"$file") bytes)"

# Rotation: remove dumps older than RETENTION_DAYS.
find backups -name 'uniquepm-*.sql' -type f -mtime "+${RETENTION_DAYS}" -delete
