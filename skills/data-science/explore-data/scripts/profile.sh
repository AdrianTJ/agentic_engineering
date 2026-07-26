#!/usr/bin/env bash
# profile-csv — fast orientation profile of a CSV file. Read-only.
set -euo pipefail

f="${1:?usage: profile.sh <file.csv> [sample_rows]}"
n="${2:-5}"
[ -f "$f" ] || { echo "error: no such file: $f" >&2; exit 1; }

total_lines=$(wc -l < "$f")
rows=$(( total_lines > 0 ? total_lines - 1 : 0 ))
cols=$(head -1 "$f" | awk -F, '{print NF}')

echo "file:    $f"
echo "rows:    $rows"
echo "columns: $cols"
echo
echo "== columns =="
head -1 "$f" | tr ',' '\n' | nl -w2 -s'. '
echo

if command -v csvstat >/dev/null 2>&1; then
  echo "== csvstat =="
  csvstat "$f"
else
  echo "== empty-field counts (naive: quoted commas not handled; install csvkit for exact) =="
  awk -F, 'NR==1 { ncols=NF; for (i=1; i<=NF; i++) name[i]=$i; next }
           { for (i=1; i<=NF; i++) if ($i=="") empty[i]++ }
           END { any=0
                 for (i=1; i<=ncols; i++) if (i in empty) { printf "%s: %d\n", name[i], empty[i]; any=1 }
                 if (!any) print "(none)" }' "$f"
fi
echo

echo "== sample ($n rows) =="
head -1 "$f"
if command -v shuf >/dev/null 2>&1; then
  tail -n +2 "$f" | shuf -n "$n"
else
  tail -n +2 "$f" | head -n "$n"
fi
