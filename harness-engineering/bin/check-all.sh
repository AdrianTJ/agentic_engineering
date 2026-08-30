#!/usr/bin/env bash
#
# check-all.sh — run every check this curriculum has, in dependency order.
#
# Exists because pass 09 pushed a commit with check-numbers.sh red. The checkers
# were run by discipline, and discipline is what failed. This is the one command
# to run before committing; install it as a hook with:
#
#   harness-engineering/bin/install-hooks.sh
#
# Link checking is skipped by default — it makes ~114 network requests and takes
# minutes. Run it explicitly with --links, or on a schedule.

set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
step() {
  printf '\n== %s ==\n' "$1"; shift
  if "$@"; then :; else echo "  ^ FAILED"; fail=1; fi
}

# Regenerate first: check-numbers compares prose against this, and a stale
# generated file makes the comparison meaningless.
step "regenerate measurements"  ./reference-harness/measure.sh
step "harness behaviour"        ./reference-harness/verify.sh
step "chapter references"       ./bin/check-refs.sh
step "citation coverage"        ./bin/check-coverage.sh
step "published numbers"        ./bin/check-numbers.sh
step "prose style (AI tells)"   python3 ./bin/check-style.py
[ "${1:-}" = "--links" ] && step "link rot" ./bin/check-links.sh

echo
if [ "$fail" -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "SOME CHECKS FAILED — do not commit"; fi
exit "$fail"
