#!/usr/bin/env bash
#
# verify.sh — prove the reference harness does what the curriculum claims.
# Every assertion here corresponds to a claim made in a chapter.
#
# Usage: harness-engineering/reference-harness/verify.sh

set -uo pipefail
cd "$(dirname "$0")"
pass=0; fail=0
ok()   { echo "  PASS  $1"; pass=$((pass+1)); }
bad()  { echo "  FAIL  $1"; fail=$((fail+1)); }
reset() { rm -rf .state; }

echo "== Ch.2: the loop reaches a stopping condition =="
reset
out=$(node harness.ts 2>&1)
echo "$out" | grep -q "stopped: goal_satisfied" && ok "clean run stops on goal_satisfied" || bad "clean run"
clean_notes=$(cat .state/NOTES.md)

echo "== Ch.2: no-progress detection =="
reset
node harness.ts >/dev/null 2>&1 <<< "" || true
reset
SCRIPT=thrash node harness.ts 2>&1 | grep -q "stopped: no_progress" \
  && ok "identical repeated calls stop the loop" || bad "no_progress not detected"

echo "== Ch.2: step budget =="
reset
SCRIPT=long node harness.ts 2>&1 | grep -q "stopped: step_budget_exhausted" \
  && ok "step budget bounds an unbounded task" || bad "step budget not enforced"

echo "== Ch.6: crash recovery reproduces the clean-run result =="
reset
CRASH_AT=3 node harness.ts >/dev/null 2>&1
resumed=$(node harness.ts 2>&1)
echo "$resumed" | grep -q "resuming at step" && ok "resumes rather than restarting" || bad "did not resume"
echo "$resumed" | grep -q "completing interrupted" && ok "finishes the call the crash interrupted" || bad "lost the interrupted call"
[ "$(cat .state/NOTES.md)" = "$clean_notes" ] \
  && ok "post-crash side effects match the clean run exactly" \
  || bad "side effects diverged after crash"

echo "== Ch.6: idempotency — no effect applied twice =="
dupes=$(sort .state/NOTES.md | uniq -d)
[ -z "$dupes" ] && ok "no duplicated side effects" || bad "duplicated: $dupes"

echo "== Ch.6: the log is append-only and complete =="
reset
node harness.ts >/dev/null 2>&1
node -e '
const fs=require("fs");
const ev=fs.readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse);
const started=ev[0]?.t==="run_started", stopped=ev.at(-1)?.t==="run_stopped";
const reqs=ev.filter(e=>e.t==="tool_requested").length;
const outs=ev.filter(e=>e.t==="tool_succeeded"||e.t==="tool_failed").length;
if(!started) { console.error("no run_started"); process.exit(1); }
if(!stopped) { console.error("no run_stopped"); process.exit(1); }
if(reqs!==outs){ console.error(`${reqs} requests vs ${outs} outcomes`); process.exit(1); }
' && ok "every request has exactly one outcome; log brackets the run" || bad "log is malformed"

echo "== Ch.4: the context policy actually changes what the model sees =="
reset
none=$(POLICY=none  SCRIPT=long node harness.ts 2>&1)
reset
comp=$(POLICY=compact SCRIPT=long node harness.ts 2>&1)
reset
full=$(POLICY=full  SCRIPT=long node harness.ts 2>&1)

occ() { echo "$1" | grep -oE '\([0-9]+% of' | grep -oE '[0-9]+'; }
bill() { echo "$1" | grep -oE '[0-9]+ tokens\)' | grep -oE '[0-9]+'; }

[ "$(occ "$none")" -gt 100 ] \
  && ok "no policy overflows the window ($(occ "$none")%)" \
  || bad "no-policy run did not overflow — the demo no longer demonstrates anything"

echo "$comp" | grep -q "compacted:" && ok "compaction fires at the threshold" || bad "compaction never fired"
[ "$(occ "$comp")" -le 100 ] && ok "compaction keeps occupancy in budget ($(occ "$comp")%)" || bad "compaction did not bound occupancy"
[ "$(occ "$full")" -le 100 ] && ok "tool clearing alone keeps occupancy in budget ($(occ "$full")%)" || bad "full policy did not bound occupancy"

# The finding this seam exists to teach: the cheaper, non-lossy technique wins.
[ "$(bill "$full")" -lt "$(bill "$comp")" ] \
  && ok "tool clearing bills fewer tokens than compaction ($(bill "$full") < $(bill "$comp"))" \
  || bad "expected tool clearing to be cheaper than compaction"
[ "$(bill "$full")" -lt "$(bill "$none")" ] \
  && ok "the policy saves tokens overall ($(bill "$full") < $(bill "$none"))" \
  || bad "policy did not save tokens"

echo "== Ch.4: compaction honours the retention contract =="
reset
POLICY=compact SCRIPT=long node harness.ts >/dev/null 2>&1
node -e '
const fs=require("fs");
const ev=fs.readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse);
const cs=ev.filter(e=>e.t==="context_compacted");
if(!cs.length){ console.error("no compaction logged"); process.exit(1); }
for(const c of cs){
  if(!c.keptContract.some(x=>x.startsWith("GOAL:"))){ console.error("a compaction dropped the GOAL"); process.exit(1); }
}
' && ok "every compaction preserved the goal, and is auditable in the log" || bad "contract violated"

reset
echo
echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ] || exit 1
