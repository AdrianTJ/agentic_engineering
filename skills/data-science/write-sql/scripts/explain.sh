#!/usr/bin/env bash
# explain.sh — print the query plan for a SQL file or piped query.
# Usage: explain.sh query.sql        OR        echo "SELECT 1" | explain.sh
# Set DB_CMD to your client invocation, e.g.:  export DB_CMD="psql -d analytics -f -"
# Set EXPLAIN_KEYWORD for engines that don't use "EXPLAIN ANALYZE" (Postgres/MySQL
# default): SQLite needs "EXPLAIN QUERY PLAN"; e.g. export EXPLAIN_KEYWORD="EXPLAIN QUERY PLAN"
set -euo pipefail
: "${DB_CMD:?set DB_CMD to your database client, e.g. 'psql -d analytics -f -'}"
keyword="${EXPLAIN_KEYWORD:-EXPLAIN ANALYZE}"
sql="$(cat "${1:-/dev/stdin}")"
printf '%s\n%s\n' "$keyword" "$sql" | eval "$DB_CMD"
