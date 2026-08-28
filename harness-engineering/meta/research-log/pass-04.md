# Research log — pass 04 (2026-08-28)

Two queries, two builds, one bug found by accident.

## Queries

| # | Query | Gap |
|---|---|---|
| 1 | `Terminal-Bench agent evaluation harness design task construction SWE-bench harness` | #5 eval harnesses |
| 2 | `Claude Agent SDK TypeScript hooks permissions canUseTool session forking compaction 2026` | #1 Ch.11 depth |

Query 1 returned the pass's best find incidentally — **Harness-Bench**, which was
not what the query was about. Fourth pass in a row where an incidental result beat
the targeted one. That is now a reliable enough pattern to plan around: run the
query, then read the *neighbours* of the result you wanted.

## Findings

### Harness-Bench (arXiv 2605.27922) → Ch.1 core

Holds the model fixed, varies the harness. 106 sandboxed offline tasks, **5,194
execution trajectories**, multiple models, shared evaluation protocol. Finds
substantial variation in completion, process quality, efficiency and failure
behavior across model–harness pairings, concluding:

> Agent capability should be reported at the model–harness configuration level
> rather than attributed to the base model alone.

This is the empirical backing for the sentence Ch.1 opens with and had, until now,
supported only by practitioner testimony. Best citation found in four passes.

Neighbours: **Claw-SWE-Bench** (2606.12344) evaluates harnesses on coding tasks;
**AgentMeter** (2606.21140) measures model–CLI matching.

### Terminal-Bench / SWE-bench harness (query 1) → Ch.8

Task shape: natural-language instruction + sandboxed workspace + **executable test
script** + reference solution. Success = transforming the environment into a
passing state, not producing correct text.

Why terminal tasks are a good eval substrate, in their own words: they *jointly*
exercise observation design, context management, control-loop policy, action
exposure, state persistence, and verification — i.e. Ch.4, Ch.2, Ch.5, Ch.6, Ch.8.
An eval touching one of those tells you about one of those.

Scale of human effort: 93 contributors, 229 candidate tasks, 89 selected after
review by three experienced reviewers. **~60% rejected.** Good expectation-setter
for anyone writing their own suite.

Runs on the Harbor task format / Harbor harness; supports Claude Code, Codex CLI,
OpenHands, Mini-SWE-Agent.

### Claude Agent SDK (query 2) → Ch.11

- **Six permission modes:** `default` (unmatched → `canUseTool`), `dontAsk`,
  `acceptEdits`, `bypassPermissions`, `plan`, `auto` (model classifier, TS only).
  Framed in Ch.11 as a **blast-radius dial, not a security boundary** — they all
  still run inside whatever sandbox you gave them.
- **Hooks:** `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`,
  `PreCompact`, `SessionStart`, `SessionEnd`, `Stop`, `SubagentStart/Stop`, more.
  Mapped to chapters: approval gate, error compaction, retention contract.
- **`system/compact_boundary`** carries trigger (`manual`/`auto`) and `pre_tokens`
  — Ch.4's measurement for free.
- **`SessionStart.source`** ∈ {`startup`, `resume`, `clear`, `compact`, `fork`} —
  Ch.6's thread identity and Ch.10's reset distinction, surfaced in an API.

## Build: the worked Ch.4 seam

The structural deliverable. `buildContext()` is now the single function deciding
what the model sees; the transcript is raw history and the context is a derived,
budgeted view. Retention contract, compaction at 70%, tool clearing, notes, and a
per-category occupancy report.

### The measurement, and the surprise

| Policy | Occupancy | Compactions | Billed |
|---|---|---|---|
| none | 105% | 0 | 4,727 |
| compact | 70% | 2 | 3,943 |
| full | 69% | 0 | **3,570** |

**Tool clearing alone beat compaction** — same occupancy, 9% fewer tokens, zero
compactions. Mechanism, visible in the breakdown: after two compactions the
retained contract was 169 tokens against 36 tokens of surviving history.
Compaction moves cost rather than removing it, because the contract is exactly
what you promised to keep.

Nothing in the bibliography says this. It came out of running it, which is the
argument for the reference harness existing.

### The tuning that made it a demonstration

First working version: 4% occupancy, compaction never fired, and the most
important technique in Ch.4 was silently untested while all assertions passed. A
demo that cannot reach its own threshold demonstrates nothing. Window → 400
tokens, step budget → 20.

Worth noting as a pattern: **the failure mode of a teaching artifact is being too
easy to trip its own interesting case.**

## The renumber bug

Three references were wrong-but-in-range, stranded by pass 02:

```
Ch.1  "Chapters 4, 6, and 7"    → should be 8
Ch.11 "Chapters 5, 6, and 8"    → should be 9
Ch.12 "Chapters 4, 5, and 7"    → should be 8
```

Pass 02's regex was `\b(Ch\.|Chapter |Chapters )(\d{1,2})\b` — it shifts the
number *adjacent to* the word. In a list, only the first number is adjacent.

Undetectable by any existing check: all three resolved to real chapters. Found by
hand, while a *different* edit failed its assertion and sent me grepping.

`bin/check-refs.sh` added, guarding what it can (out-of-range references, chapters
unlinked from the README) with a header stating plainly that it **cannot** catch
the in-range-wrong case. Overstating a validator's coverage is worse than not
having it.

## Build: the exit assessment

`ASSESSMENT.md` — one task per chapter with an objective pass condition. Not an
answer key: most *Check yourself* questions have several defensible answers.

The exit condition is Ch.8's: change the harness and prove what the change did,
including one change that made things worse and which you kept.

## Validation

- `check-links.sh`: 100 sources, **89 OK / 11 WARN / 0 FAIL**
- `check-coverage.sh`, `check-refs.sh`: passing
- `verify.sh`: **15/15** (was 8/8)

One transient `FAIL` mid-pass, cleared on re-run. The pass-02 hardening (45s + one
retry) reduces but does not eliminate this.
