#!/usr/bin/env bash
#
# check-coverage.sh — every URL linked from the curriculum's prose must appear in
# sources.tsv, so bin/check-links.sh actually covers it.
#
# Usage: harness-engineering/bin/check-coverage.sh

set -uo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

grep -rhoE 'https?://[^ )>"]+' chapters/*.md README.md GLOSSARY.md \
  | sed 's/[.,)]*$//' | sort -u > /tmp/hе_prose_urls.txt 2>/dev/null || true
grep -rhoE 'https?://[^ )>"]+' chapters/*.md README.md GLOSSARY.md \
  | sed 's/[.,)]*$//' | sort -u > "$DIR/.prose-urls.tmp"
cut -f6 sources.tsv | tail -n +2 | sort -u > "$DIR/.tsv-urls.tmp"

missing=$(comm -23 "$DIR/.prose-urls.tmp" "$DIR/.tsv-urls.tmp")
rm -f "$DIR/.prose-urls.tmp" "$DIR/.tsv-urls.tmp" /tmp/hе_prose_urls.txt

if [ -n "$missing" ]; then
  echo "FAIL: linked from prose but absent from sources.tsv:"
  echo "$missing" | sed 's/^/  /'
  exit 1
fi
echo "OK: every prose URL is registered in sources.tsv"
