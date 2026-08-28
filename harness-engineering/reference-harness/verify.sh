#!/usr/bin/env bash
#
# verify.sh — prove the reference harness does what the curriculum claims.
# Every assertion corresponds to a claim made in a chapter.
#
# Usage:
#   ./verify.sh              run, compare against baseline.json, fail on regression
#   ./verify.sh --baseline   run and rewrite baseline.json (do this deliberately)
#   ./verify.sh --json       machine-readable results only, on stdout
#
# Ch.8 tells the reader to emit structured results and commit a baseline instead
# of eyeballing printed lines. This is that, so the curriculum ships what it asks
# for. results.json is written every run; baseline.json is committed.
#
# Assertion NAMES ARE STABLE IDENTITIES: `chk` records one name whether the check
# passes or fails. An earlier version used a different message on each branch, so
# a regression looked like an assertion disappearing and a new one arriving — the
# baseline diff could not tell a regression from a rename.

set -uo pipefail
cd "$(dirname "$0")"
MODE="${1:-}"
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
pass=0; fail=0; section="(none)"

quiet() { [ "$MODE" = "--json" ]; }
say()   { quiet || echo "$@"; }
sec()   { section="$1"; say "== $1 =="; }
# chk <name> — consumes the exit status of the immediately preceding command.
chk()   { if [ $? -eq 0 ]; then say "  PASS  $1"; pass=$((pass+1)); printf 'pass\t%s\t%s\n' "$section" "$1" >> "$TMP";
          else say "  FAIL  $1"; fail=$((fail+1)); printf 'fail\t%s\t%s\n' "$section" "$1" >> "$TMP"; fi; }
reset() { rm -rf .state; }

sec "Ch.2: the loop and its stopping conditions"
reset
out=$(node harness.ts 2>&1)
clean_notes=$(cat .state/NOTES.md)
echo "$out" | grep -q "stopped: goal_satisfied"; chk "clean run stops on goal_satisfied"
reset; SCRIPT=thrash node harness.ts 2>&1 | grep -q "stopped: no_progress"; chk "identical repeated calls trip no-progress"
reset; SCRIPT=long node harness.ts 2>&1 | grep -q "stopped: step_budget_exhausted"; chk "step budget bounds an unbounded task"

sec "Ch.6: crash recovery"
reset
CRASH_AT=3 node harness.ts >/dev/null 2>&1
resumed=$(node harness.ts 2>&1)
echo "$resumed" | grep -q "resuming at step"; chk "resumes rather than restarting"
echo "$resumed" | grep -q "completing interrupted"; chk "finishes the call the crash interrupted"
[ "$(cat .state/NOTES.md)" = "$clean_notes" ]; chk "post-crash side effects match a clean run exactly"
[ -z "$(sort .state/NOTES.md | uniq -d)" ]; chk "no side effect applied twice"

sec "Ch.6: the event log is well formed"
reset; node harness.ts >/dev/null 2>&1
node -e '
const ev=require("fs").readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse);
const reqs=ev.filter(e=>e.t==="tool_requested").length;
const outs=ev.filter(e=>["tool_succeeded","tool_failed","tool_denied"].includes(e.t)).length;
process.exit(ev[0]?.t==="run_started" && ev.at(-1)?.t==="run_stopped" && reqs===outs ? 0 : 1);
' 2>/dev/null; chk "every request has one outcome; the log brackets the run"

sec "Ch.4: the context policy changes what the model sees"
reset; none=$(POLICY=none   SCRIPT=long node harness.ts 2>&1)
reset; comp=$(POLICY=compact SCRIPT=long node harness.ts 2>&1)
reset; full=$(POLICY=full   SCRIPT=long node harness.ts 2>&1)
occ()  { echo "$1" | grep -oE '\([0-9]+% of' | grep -oE '[0-9]+'; }
bill() { echo "$1" | grep -oE '[0-9]+ tokens\)' | grep -oE '[0-9]+'; }
[ "$(occ "$none")" -gt 100 ]; chk "no policy overflows the window"
echo "$comp" | grep -q "compacted:"; chk "compaction fires at the threshold"
[ "$(occ "$comp")" -le 100 ]; chk "compaction bounds occupancy"
[ "$(occ "$full")" -le 100 ]; chk "tool clearing bounds occupancy"
[ "$(bill "$full")" -lt "$(bill "$comp")" ]; chk "tool clearing bills fewer tokens than compaction"
[ "$(bill "$full")" -lt "$(bill "$none")" ]; chk "the policy saves tokens overall"

sec "Ch.4: compaction honours the retention contract"
reset; POLICY=compact SCRIPT=long node harness.ts >/dev/null 2>&1
node -e '
const ev=require("fs").readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse);
const cs=ev.filter(e=>e.t==="context_compacted");
process.exit(cs.length && cs.every(c=>c.keptContract.some(x=>x.startsWith("GOAL:"))) ? 0 : 1);
' 2>/dev/null; chk "every compaction preserved the goal and is auditable"

sec "Ch.9: the policy engine blocks the lethal trifecta"
reset; exf=$(SCRIPT=exfil node harness.ts 2>&1)
echo "$exf" | grep -q "DENIED: egress blocked"; chk "egress denied once untrusted content is in context"
! echo "$exf" | grep -q "posted .* chars externally"; chk "nothing was sent externally"
reset; off=$(SCRIPT=exfil POLICY_OFF=1 node harness.ts 2>&1)
echo "$off" | grep -q "posted .* chars externally"; chk "policy-off run exfiltrates, so the control is load-bearing"

sec "Ch.9 + Ch.6: approval is a durable wait"
reset; park=$(SCRIPT=egress node harness.ts 2>&1)
echo "$park" | grep -q "parked: awaiting approval"; chk "run parks rather than blocking"
! echo "$park" | grep -q "posted .* chars externally"; chk "nothing sent while unapproved"
res=$(SCRIPT=egress APPROVE=1 node harness.ts 2>&1)
echo "$res" | grep -q "approval granted"; chk "a later process can grant the approval"

sec "Ch.9: an approval is a budget, not a standing permit"
node -e '
const ev=require("fs").readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse);
const g=ev.filter(e=>e.t==="approval_granted").length;
const s=ev.filter(e=>e.t==="tool_succeeded"&&e.key.includes("post_webhook")).length;
process.exit(g===1 && s===1 ? 0 : 1);
' 2>/dev/null; chk "one grant authorised exactly one send"
echo "$res" | grep -q "parked: awaiting approval"; chk "the next send re-prompts once the budget is spent"

reset

# ── structured results ────────────────────────────────────────────────────────
{
  printf '{\n  "pass": %d,\n  "fail": %d,\n  "assertions": [\n' "$pass" "$fail"
  first=1
  while IFS=$'\t' read -r st se na; do
    [ $first -eq 1 ] || printf ',\n'; first=0
    printf '    {"status": "%s", "section": "%s", "name": "%s"}' "$st" "$se" "$na"
  done < "$TMP"
  printf '\n  ]\n}\n'
} > results.json

[ "$MODE" = "--json" ] && cat results.json
if [ "$MODE" = "--baseline" ]; then
  cp results.json baseline.json
  say ""; say "baseline updated: $pass passing, $fail failing"
  exit 0
fi

rc=0
[ "$fail" -eq 0 ] || rc=1
if [ -f baseline.json ]; then
  diffout=$(node -e '
    const fs=require("fs");
    const b=JSON.parse(fs.readFileSync("baseline.json","utf8"));
    const r=JSON.parse(fs.readFileSync("results.json","utf8"));
    const was=new Map(b.assertions.map(a=>[a.name,a.status]));
    const now=new Map(r.assertions.map(a=>[a.name,a.status]));
    const out=[];
    for(const [n,s] of now) if(s==="fail"&&was.get(n)==="pass") out.push("REGRESSED: "+n);
    for(const n of was.keys()) if(!now.has(n)) out.push("DISAPPEARED: "+n);
    for(const n of now.keys()) if(!was.has(n)) out.push("NEW (re-baseline deliberately): "+n);
    console.log(out.join("\n"));
  ')
  if [ -n "$diffout" ]; then
    say ""; say "$diffout"
    echo "$diffout" | grep -qE '^(REGRESSED|DISAPPEARED)' && rc=1
  fi
fi
say ""
say "pass=$pass fail=$fail  rc=$rc"
exit $rc
