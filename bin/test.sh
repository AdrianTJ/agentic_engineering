#!/usr/bin/env bash
#
# test.sh — repo-wide checks. Run locally before pushing; CI runs the same script.
#
# Checks:
#   1. Every SKILL.md conforms to the Agent Skills spec, and every skill has a
#      structurally valid evals/evals.json (bin/validate.py).
#   2. Ruler can project the library — catches a malformed skill directory that
#      is individually valid but breaks distribution. Skipped if ruler isn't
#      installed, so the suite still runs offline.
#   3. Any script bundled with a skill is executable and parses.

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
fail=0
err() { echo "FAIL: $*" >&2; fail=1; }

echo "== 1. skills conform to the spec, evals are well formed =="
python3 bin/validate.py || err "skill/eval validation failed"

echo
echo "== 2. ruler can project the library =="
if command -v ruler >/dev/null 2>&1; then
  # Project into a throwaway dir so the repo itself stays clean.
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  mkdir -p "$tmp/.ruler"
  cp -R .ruler/skills "$tmp/.ruler/skills"
  if ! (cd "$tmp" && ruler apply --agents claude --no-mcp >/dev/null 2>&1); then
    err "ruler apply failed on this library"
  else
    want=$(find .ruler/skills -name SKILL.md | wc -l)
    got=$(find "$tmp/.claude/skills" -name SKILL.md 2>/dev/null | wc -l)
    [ "$want" -eq "$got" ] || err "ruler projected $got skills, expected $want"
  fi
else
  echo "   (ruler not installed — skipping; npm i -g @intellectronica/ruler)"
fi

echo
echo "== 3. bundled scripts are executable and parse =="
while IFS= read -r s; do
  [ -x "$s" ] || err "$s is not executable"
  case "$s" in
    *.sh) bash -n "$s" || err "$s has syntax errors" ;;
    *.py) python3 -m py_compile "$s" || err "$s has syntax errors" ;;
  esac
done < <(find .ruler/skills -type f \( -name '*.sh' -o -name '*.py' \))

if [ "$fail" -ne 0 ]; then
  echo; echo "TESTS FAILED" >&2; exit 1
fi
echo; echo "all checks passed"
