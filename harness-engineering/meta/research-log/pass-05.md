# Research log — pass 05 (2026-08-28)

Three queries, two builds, one measurement that went badly for the curriculum.

## Queries

| # | Query | Gap |
|---|---|---|
| 1 | `LLM routing cost savings measured benchmark RouteLLM academic evaluation quality tradeoff` | #3 vendor claims |
| 2 | `agent permission blast radius policy engine capability confinement coding agent implementation` | #1 Ch.9 seam |
| 3 | `CaMeL Google DeepMind defeating prompt injection design capabilities control flow data flow paper` | #1 (follow-up) |

Query 3 was a follow-up to 2, and again the follow-up beat the original — fifth
pass running. Query 2 named CaMeL in passing; query 3 got the primary, the
AgentDojo number, and Willison's explanation.

## Findings

### RouteLLM (query 1 → Ch.7 core, ahead of the vendor source)

arXiv 2406.18665 (Ong et al., LMSYS). Independent measurement of the routing
claim, **with the quality axis reported**:

- ~85% cost reduction retaining ~95% of GPT-4 performance on MT-Bench.
- Matrix-factorization routers: 95% of GPT-4 quality using **26% GPT-4 calls**.
- Published range across query distributions: roughly **40–98%**.
- Benchmarks: RouterBench (405k precomputed outputs, 11 models, 7 tasks), RouterEval.

The vendor figure Ch.7 already cited (60–80%) sits inside that range while
omitting the quality cost. Ch.7 now says so explicitly.

Consequence worth naming: routing is evaluated against a benchmark, so **you need
your own eval before you route.** Ch.8's regression suite is a prerequisite for
Ch.7's largest lever, not a follow-up. That dependency was not previously stated
anywhere in the curriculum.

### CaMeL (query 3 → Ch.9 core, and the design for the seam)

arXiv 2503.18813, "Defeating Prompt Injections by Design", Google DeepMind.

- Extract control and data flow from the **trusted** query, so untrusted data can
  never influence program flow.
- Capability metadata on values; a custom Python interpreter enforces policy.
- No modification to the LLM.
- **67% of AgentDojo tasks solved with *provable* security.**

The uncomfortable corollary, from the surrounding literature: as of 2026 no
production-grade CaMeL implementation exists and **no mainstream agent harness has
adopted the pattern** — not Claude Code, Cursor, Copilot Agent, or Gemini CLI. The
best-understood defense in the field is not in the tools anyone uses. Ch.9 states
this and declines to resolve whether that is a research gap or an industry one.

Also: *Before the Tool Call* (2603.20953) gives the implementable four layers —
model alignment, **deterministic pre-action authorization**, sandboxed execution,
post-hoc evaluation — of which only the middle two are controls. And its argument
for intent-based authorization over RBAC: roles cannot describe a dynamic
workflow, which is what an agent is.

Sophos (webfetch-only) contributed two patterns nothing else in Ch.9 covered:
**credential isolation** (resolve secrets outside the model's context, removing
the target rather than guarding it) and **sealed tool endpoints** (fixed-schema
tools behind a credential-holding broker with per-tool egress allow-lists).

## Build: the Ch.9 seam

`authorize()` — deterministic, outside the model, readable in one screen. Blast
radius per tool, a taint bit, the trifecta check, approval as a durable wait.

`POLICY_OFF=1` runs the identical script and the data leaves. That negative
control is the point: **a security control never observed failing open has not
been tested.**

### Two wrong designs, found by running it

| Keying | Result |
|---|---|
| by idempotency key `step:tool:args` | 1 human decision → **3 prompts** (each retry looked new) |
| logical `tool:args`, boolean | 1 prompt → **4 sends** (a standing permit) |
| logical `tool:args`, **use count** | 1 prompt → 1 send → re-prompt ✓ |

Two ledgers, two questions, two keys: idempotency asks *did this occurrence
happen?*; approval asks *did a human bless this action, and how many times?* The
approval's value is a count, almost always 1.

Second time the harness has taught the curriculum something the sources don't say.

## Build: structured evals

`verify.sh` now writes `results.json`, diffs against a committed `baseline.json`,
and exits non-zero on regression. Ch.8's assessment asks the reader for exactly
this, so the curriculum now ships what it asks for. 15 → **23 assertions**.

### Bug: unstable assertion identities

First version used `ok "X"` / `bad "Y"` — a different name per branch. A real
regression therefore showed as one assertion DISAPPEARING and another arriving,
which is indistinguishable from a rename. Fixed with a single `chk <name>` helper
consuming the preceding exit status, so the name is a stable identity.

### And a bug in my test of the bug

My first check of the exit code piped through `tail` and read *tail's* status, so
the gate appeared to fail open when it was fine. Testing a test is not optional.

Verified properly by injecting a real regression (disabling the trifecta check):
`REGRESSED`, exit 1. Restored: exit 0.

## Measurement: the reading estimates

Nine core sources, word count at 200 wpm against the stated `~N min`:

| Source | Est. | Measured | Error |
|---|---|---|---|
| Writing effective tools | 35 | 17 | 2.1× high |
| Harness design long-running | 40 | 27 | 1.5× high |
| The lethal trifecta | 10 | 10 | exact |
| Art of loop engineering | 20 | 29 | 0.7× low |
| Anatomy of an agent harness | 20 | 34 | 0.6× low |
| Building LangGraph | 30 | 43 | 0.7× low |
| Harness eng. for self-improvement | 45 | 72 | 0.6× low |

No systematic bias — just noise, in both directions. Two more sources returned
zero words (JS-rendered pages), so the method itself has a coverage gap. Both
columns carry error: 200 wpm is generous for dense papers, and the counts include
page boilerplate.

Published in the README with the table rather than silently corrected or deleted.
Recalibration is a pass-06 task.

## Validation

- `check-links.sh`: 109 sources, **97 OK / 12 WARN / 0 FAIL**
- `check-coverage.sh`, `check-refs.sh`: passing
- `verify.sh`: **23/23** against committed baseline
