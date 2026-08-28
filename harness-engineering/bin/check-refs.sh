#!/usr/bin/env bash
#
# check-refs.sh — every "Ch.N" / "Chapter N" reference must point at a chapter
# that exists.
#
# Caveat, stated honestly: this catches references to a chapter that is not
# there. It CANNOT catch a reference that is in range but points at the wrong
# chapter — which is exactly what a renumber produces. Pass 04 found three of
# those by hand ("Chapters 5, 6, and 8" where only the first number was shifted).
# If you renumber again, grep for list-style references by eye as well.

set -uo pipefail
cd "$(dirname "$0")/.."
max=$(ls chapters/ | sed -E 's/^([0-9]+)-.*/\1/' | sort -n | tail -1 | sed 's/^0*//')
bad=0
while read -r n; do
  num=$(echo "$n" | sed 's/^0*//')
  if [ "$num" -lt 1 ] || [ "$num" -gt "$max" ]; then
    echo "FAIL: reference to chapter $num, but chapters run 1..$max"
    bad=1
  fi
done < <(grep -rhoE '\b(Ch\.|Chapter |Chapters )[0-9]{1,2}\b' chapters/*.md README.md GLOSSARY.md \
         | grep -oE '[0-9]{1,2}$' | sort -un)

# Every chapter file must be linked from the README.
for f in chapters/*.md; do
  grep -q "$f" README.md || { echo "FAIL: $f is not linked from README.md"; bad=1; }
done

[ "$bad" -eq 0 ] && echo "OK: all chapter references resolve; every chapter is linked" || exit 1
