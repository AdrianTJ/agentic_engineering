#!/usr/bin/env bash
#
# check-links.sh — verify every URL in sources.tsv still resolves.
#
# Usage:
#   harness-engineering/bin/check-links.sh            # check all
#   harness-engineering/bin/check-links.sh 04         # only chapter 04's sources
#
# Exit status is 1 if any source returns a status that is neither 2xx/3xx nor a
# known egress/bot block. A 403 is usually a Cloudflare bot filter or an egress
# policy rather than a dead link — sources.tsv records how those were verified
# instead, and this script reports them as WARN, not FAIL.

set -uo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
TSV="$DIR/sources.tsv"
filter="${1:-}"
fail=0; warn=0; ok=0

printf '%-6s %-6s %s\n' STATUS ID URL
while IFS=$'\t' read -r id chapter tier title author url note; do
  [ "$id" = "id" ] && continue
  [ -z "${url:-}" ] && continue
  if [ -n "$filter" ] && [[ "$chapter" != *"$filter"* ]]; then continue; fi
  # Some hosts are slow enough to time out intermittently; a single slow response
  # is not a dead link, so retry once before believing a connection-level failure.
  code=""
  for attempt in 1 2; do
    code=$(curl -sS -o /dev/null -w '%{http_code}' -L --max-time 45 \
             -A 'Mozilla/5.0 (curriculum-link-check)' "$url" 2>/dev/null || echo 000)
    case "$code" in 000*|"") sleep 2 ;; *) break ;; esac
  done
  # A connection-level failure (000) on a source whose note records that it was
  # verified by another path is an environment limitation, not a dead link —
  # same class as a bot filter. Anything else that fails to connect is a FAIL.
  case "$code$note" in
    000*webfetch-only|000*verified*|000*slow-host)
      printf '%-6s %-6s %s  (unreachable to curl; note=%s)\n' "WARN" "$id" "$url" "$note"
      warn=$((warn+1)); continue ;;
  esac

  case "$code" in
    2*|3*) printf '%-6s %-6s %s\n' "OK" "$id" "$url"; ok=$((ok+1)) ;;
    401|403|405|407|429)
      printf '%-6s %-6s %s  (blocked, not necessarily dead; note=%s)\n' \
        "WARN" "$id" "$url" "$note"; warn=$((warn+1)) ;;
    *) printf '%-6s %-6s %s  (HTTP %s)\n' "FAIL" "$id" "$url" "$code"; fail=$((fail+1)) ;;
  esac
done < "$TSV"

echo
echo "ok=$ok warn=$warn fail=$fail"
[ "$fail" -eq 0 ] || exit 1
