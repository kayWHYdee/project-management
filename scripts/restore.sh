#!/usr/bin/env bash
#
# Restore the database from a dump produced by backup.sh.
# THIS OVERWRITES THE CURRENT DATA. Usage:
#   scripts/restore.sh backups/uniquepm-YYYYMMDD-HHMMSS.sql
#
set -euo pipefail

file="${1:?Usage: scripts/restore.sh <backups/uniquepm-*.sql>}"

cd "$(dirname "$0")/.."
set -a
# shellcheck disable=SC1091
source .env
set +a

if [ ! -f "$file" ]; then
  echo "No such file: $file" >&2
  exit 1
fi

echo "Restoring '$file' into database '$POSTGRES_DB'. This overwrites current data."
read -r -p "Type 'yes' to continue: " confirm
[ "$confirm" = "yes" ] || { echo "Aborted."; exit 1; }

docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <"$file"
echo "Restore complete. Restart the API if it was running: docker compose restart api"
