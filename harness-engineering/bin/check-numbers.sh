#!/usr/bin/env bash
#
# check-numbers.sh — every figure the prose quotes about the reference harness
# must match the current measurement.
#
# The published numbers went stale twice (passes 04→07 and 07→08): adding a tool
# changed the tools block and silently invalidated token counts across four
# chapters, and nothing caught it. This is the check that would have.
#
# Run `reference-harness/measure.sh` first; this compares the docs against it.

set -uo pipefail
cd "$(dirname "$0")/.."
M=reference-harness/MEASUREMENTS.md
[ -f "$M" ] || { echo "FAIL: $M missing — run reference-harness/measure.sh"; exit 1; }

# Guard against the obvious hole: comparing prose to a generated file that is
# itself stale. If the harness changed after MEASUREMENTS.md was written, every
# check below is meaningless.
for src in reference-harness/harness.ts reference-harness/verify.sh; do
  if [ "$src" -nt "$M" ]; then
    echo "FAIL: $src is newer than $M."
    echo "      The measurements are stale; run reference-harness/measure.sh first."
    exit 1
  fi
done

bad=0
# Pull canonical values out of the generated file.
row()  { grep -E "^\| $1 \|" "$M" | awk -F'|' '{gsub(/ /,"",$0)}1' | head -1; }
val()  { grep -E "^\| $1 \|" "$M" | awk -F'|' -v c="$2" '{gsub(/ /,"",$c); print $c}' | head -1; }
comma(){ printf "%s" "$1" | sed ':a;s/\B[0-9]\{3\}\>/,&/;ta'; }

# (label, value, file, human description)
check() { # <value> <file> <what>
  local v="$1" f="$2" what="$3"
  if grep -qF -- "$(comma "$v")" "$f" || grep -qF -- "$v" "$f"; then
    echo "  ok    $what = $(comma "$v")  ($f)"
  else
    echo "  FAIL  $what should be $(comma "$v") — not found in $f"; bad=1
  fi
}

echo "checking prose against $M"
# Table columns: | 2=policy | 3=compactions | 4=hit | 5=raw | 6=billed |
check "$(val compact 6)" chapters/04-context-and-memory.md      "compact billed"
check "$(val clear 6)"   chapters/04-context-and-memory.md      "clear billed"
check "$(val none 6)"    chapters/04-context-and-memory.md      "none billed"
check "$(val compact 5)" chapters/04-context-and-memory.md      "compact raw"
check "$(val clear 5)"   chapters/03-graphs-and-control-flow.md "dynamic raw tokens"
check "$(awk -F'|' '/ROUTER=on/{gsub(/ /,"",$4); print $4}' "$M" | head -1)" \
      chapters/03-graphs-and-control-flow.md "routed raw tokens"
check "$(grep -oE '\*\*[0-9]+ tokens\*\* of' "$M" | grep -oE '[0-9]+')" \
      chapters/05-tools-and-definitions.md   "fixed tool cost"
check "$(grep -oE '\*\*[0-9]+ assertions\*\*' "$M" | grep -oE '[0-9]+')" \
      reference-harness/README.md            "assertion count"
check "$(grep -oE '\*\*[0-9]+ assertions\*\*' "$M" | grep -oE '[0-9]+')" \
      README.md                              "assertion count (top-level README)"

echo
[ "$bad" -eq 0 ] && echo "OK: prose agrees with the current measurement" || {
  echo "Numbers have drifted. Update the prose, or re-run measure.sh if the code changed."; exit 1; }
