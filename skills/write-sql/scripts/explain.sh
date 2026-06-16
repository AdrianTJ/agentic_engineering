#!/usr/bin/env bash
# explain.sh — print the query plan for a SQL file or piped query.
# Usage: explain.sh query.sql        OR        echo "SELECT 1" | explain.sh
# Set DB_CMD to your client invocation, e.g.:  export DB_CMD="psql -d analytics -f -"
set -euo pipefail
: "${DB_CMD:?set DB_CMD to your database client, e.g. 'psql -d analytics -f -'}"
sql="$(cat "${1:-/dev/stdin}")"
printf 'EXPLAIN ANALYZE\n%s\n' "$sql" | eval "$DB_CMD"
