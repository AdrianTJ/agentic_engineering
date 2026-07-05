#!/usr/bin/env bash
#
# test.sh — repo-wide checks. Run locally before pushing; CI runs the same script.
#
# Checks:
#   1. bin/generate.sh parses and builds every harness with zero warnings,
#      in both symlink and copy mode, and no dist symlink is broken.
#   2. Skill names are unique across category directories.
#   3. Every SKILL.md / TOOL.md / AGENT.md carries its required frontmatter.
#   4. Every TOOL.md entrypoint exists and is executable.
#   5. Every eval spec validates against shared/eval-spec.md (tools/validate-evals).

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
fail=0
err() { echo "FAIL: $*" >&2; fail=1; }

echo "== 1. generator builds cleanly (symlink + copy) =="
bash -n bin/generate.sh || err "generate.sh has syntax errors"
for mode in "" "--copy"; do
  # shellcheck disable=SC2086
  warnings=$(bash bin/generate.sh $mode --all 2>&1 >/dev/null | grep "warning:" || true)
  if [ -n "$warnings" ]; then
    err "generator warnings in mode '${mode:-symlink}':"$'\n'"$warnings"
  fi
done
bash bin/generate.sh --all >/dev/null   # leave dist/ in symlink mode for the link check
broken=$(find dist -xtype l 2>/dev/null || true)
[ -z "$broken" ] || err "broken symlinks in dist/:"$'\n'"$broken"

echo "== 2. skill and tool names unique =="
dupes=$(find skills -mindepth 2 -maxdepth 2 -type d -printf '%f\n' | sort | uniq -d)
[ -z "$dupes" ] || err "duplicate skill names across categories: $dupes"

echo "== 3. frontmatter present =="
while IFS= read -r f; do
  grep -q '^name:' "$f"        || err "$f: missing 'name' frontmatter"
  grep -q '^description:' "$f" || err "$f: missing 'description' frontmatter"
done < <(find skills tools -name 'SKILL.md' -o -name 'TOOL.md')
for f in agents/*/AGENT.md; do
  grep -q '^name:' "$f" || err "$f: missing 'name' frontmatter"
  grep -q '^role:' "$f" || err "$f: missing 'role' frontmatter"
done

echo "== 4. tool entrypoints exist and are executable =="
for toolmd in tools/*/TOOL.md; do
  tooldir="$(dirname "$toolmd")"
  entry=$(awk -F': *' '/^entrypoint:/ {print $2; exit}' "$toolmd")
  [ -n "$entry" ] || { err "$toolmd: missing 'entrypoint' frontmatter"; continue; }
  [ -f "$tooldir/$entry" ] || err "$toolmd: entrypoint '$entry' not found"
  [ -x "$tooldir/$entry" ] || err "$toolmd: entrypoint '$entry' not executable"
done

echo "== 5. eval specs validate =="
python3 tools/validate-evals/validate_evals.py || err "eval spec validation failed"

if [ "$fail" -ne 0 ]; then
  echo; echo "TESTS FAILED" >&2; exit 1
fi
echo; echo "all checks passed"
