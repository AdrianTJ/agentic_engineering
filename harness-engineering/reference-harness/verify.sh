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

sec "Ch.7: cache accounting inverts the raw-token ranking"
bill_raw() { echo "$1" | grep -oE '[0-9]+ tokens\)' | grep -oE '[0-9]+'; }
bill_net() { echo "$1" | grep -oE 'billed: [0-9]+' | grep -oE '[0-9]+'; }
hit()      { echo "$1" | grep -oE '\([0-9]+% hit' | grep -oE '[0-9]+'; }
reset; cmp_out=$(POLICY=compact SCRIPT=long node harness.ts 2>&1)
reset; clr_out=$(POLICY=clear   SCRIPT=long node harness.ts 2>&1)
[ "$(bill_raw "$clr_out")" -lt "$(bill_raw "$cmp_out")" ]
chk "tool clearing uses fewer RAW tokens than compaction"
[ "$(bill_net "$clr_out")" -gt "$(bill_net "$cmp_out")" ]
chk "tool clearing costs MORE once the cache is billed (the ranking inverts)"
[ "$(hit "$cmp_out")" -gt "$(hit "$clr_out")" ]
chk "compaction achieves the higher cache hit rate"

sec "Ch.7: the cache-granularity result"
reset; cn=$(CACHE_MODEL=chunk POLICY=none    SCRIPT=long node harness.ts 2>&1)
reset; cc=$(CACHE_MODEL=chunk POLICY=compact SCRIPT=long node harness.ts 2>&1)
reset; cl=$(CACHE_MODEL=chunk POLICY=clear   SCRIPT=long node harness.ts 2>&1)
nb=$(bill_net "$cn"); cb=$(bill_net "$cc"); lb=$(bill_net "$cl")
[ "$cb" -lt "$lb" ]; chk "chunk granularity: the compact-beats-clear ordering survives"
# The magnitude collapse: doing nothing goes from ~3.4x compaction to near parity.
[ "$((nb * 100 / cb))" -lt 150 ]
chk "chunk granularity: no-policy comes within 50% of compaction (magnitude collapses)"
reset; bn=$(bill_net "$(POLICY=none SCRIPT=long node harness.ts 2>&1)")
[ "$((bn * 100 / nb))" -gt 200 ]
chk "the coarse model overstates no-policy cost by more than 2x"

sec "Ch.10: context reset hands off through an artifact"
reset; rst=$(POLICY=reset SCRIPT=long node harness.ts 2>&1)
echo "$rst" | grep -q "context reset:"; chk "reset fires at the occupancy threshold"
[ -f .state/HANDOFF.md ]; chk "a handoff artifact is written"
grep -q "^## Goal" .state/HANDOFF.md && grep -q "^## Done" .state/HANDOFF.md
chk "the handoff carries the goal and what is already done"
echo "$rst" | grep -q "stopped: step_budget_exhausted"; chk "the run completes across resets"
# The bug this bounding fixed: an unbounded Done list grows the artifact until it
# fills the window on its own, and resets fire twice as often.
sizes=$(grep -oE "handoff is [0-9]+ bytes" <<<"$rst" | grep -oE '[0-9]+')
first=$(head -1 <<<"$sizes"); last=$(tail -1 <<<"$sizes")
[ $((last - first)) -lt 100 ]; chk "the handoff stays bounded rather than growing each reset"

sec "Ch.4: compaction honours the retention contract"
reset; POLICY=compact SCRIPT=long node harness.ts >/dev/null 2>&1
node -e '
const ev=require("fs").readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse);
const cs=ev.filter(e=>e.t==="context_compacted");
process.exit(cs.length && cs.every(c=>c.keptContract.some(x=>x.startsWith("GOAL:"))) ? 0 : 1);
' 2>/dev/null; chk "every compaction preserved the goal and is auditable"

sec "Ch.3: a static edge is a model call you do not pay for"
reset; ROUTER=on SCRIPT=long node harness.ts >/dev/null 2>&1
routed_files=$(node -pe '
  const ev=require("fs").readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse);
  ev.filter(e=>e.t==="tool_succeeded").map(e=>e.key.split(":").slice(2).join(":")).sort().join(",")')
rt_calls=$(node -pe 'require("fs").readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse).filter(e=>e.t==="model_called").length')
reset; SCRIPT=long node harness.ts >/dev/null 2>&1
dyn_files=$(node -pe '
  const ev=require("fs").readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse);
  ev.filter(e=>e.t==="tool_succeeded").map(e=>e.key.split(":").slice(2).join(":")).sort().join(",")')
dyn_calls=$(node -pe 'require("fs").readFileSync(".state/events.jsonl","utf8").trim().split("\n").map(JSON.parse).filter(e=>e.t==="model_called").length')
[ "$routed_files" = "$dyn_files" ]; chk "static routing does exactly the same work"
[ "$rt_calls" -lt "$dyn_calls" ]; chk "static routing makes strictly fewer model calls"

sec "Ch.9: the policy engine blocks the lethal trifecta"
reset; exf=$(SCRIPT=exfil node harness.ts 2>&1)
echo "$exf" | grep -q "DENIED: egress blocked"; chk "egress denied when the payload derives from untrusted data"
! echo "$exf" | grep -q "posted .* chars externally"; chk "nothing was sent externally"
reset; off=$(SCRIPT=exfil POLICY_OFF=1 node harness.ts 2>&1)
echo "$off" | grep -q "posted .* chars externally"; chk "policy-off run exfiltrates, so the control is load-bearing"

sec "Ch.9: provenance is per-value, not run-wide"
reset; ben=$(SCRIPT=benign node harness.ts 2>&1)
echo "$ben" | grep -q "read_file -> contents of attacker-controlled"; chk "the benign run does read untrusted content"
! echo "$ben" | grep -q "DENIED"; chk "unrelated egress is NOT blocked by an unrelated untrusted read"
echo "$ben" | grep -q "needs approval"; chk "unrelated egress still reaches the approval gate"

sec "Ch.9: the control's documented failure mode (laundering)"
# This asserts the check DOES NOT catch a paraphrase. A control's known limits
# are part of its spec; if someone strengthens the check, this flags for a
# deliberate re-baseline rather than silently passing.
reset; lau=$(SCRIPT=launder APPROVE=1 node harness.ts 2>&1)
echo "$lau" | grep -q "posted .* chars externally"; chk "KNOWN LIMIT: a paraphrase bypasses the substring check"

sec "Ch.9: authorization is not containment"
ESC=/tmp/escaped-the-workspace.txt
rm -f "$ESC"; reset
SCRIPT=escape node harness.ts >/dev/null 2>&1
[ -f "$ESC" ]; chk "unsandboxed, the policy PERMITS a write outside the workspace"
rm -f "$ESC"; reset
./run-sandboxed.sh SCRIPT=escape >/dev/null 2>&1
[ ! -f "$ESC" ]; chk "sandboxed, the runtime BLOCKS the same call the policy allowed"
rm -f "$ESC"

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
