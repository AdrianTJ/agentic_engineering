# Harness contracts

Language-neutral definitions for the reference harness. `harness.ts` is one
implementation; a Rust implementation (Ch.12) that honors these can read the same
logs and resume the same runs.

These are deliberately small. A contract you can hold in your head is one you will
actually keep.

## 1. The workspace

```
.state/
  events.jsonl    append-only event log; the source of truth
  NOTES.md        the agent's durable scratchpad (Ch.4)
  HANDOFF.md      the handoff artifact (Ch.10) — not yet implemented
```

**Rule: context is a cache, the workspace is the database.** Anything that must
survive a compaction, a reset, or a crash lives here as a file. Nothing important
lives only in the conversation.

## 2. The event log

One JSON object per line, append-only, never rewritten. Current state is a fold
over the log; there is no separate state file to fall out of sync (12-factor #5).

| `t` | Fields | Meaning |
|---|---|---|
| `run_started` | `goal`, `at` | Brackets the run. First line, exactly once. |
| `model_called` | `step`, `tokens` | A decision was requested. |
| `tool_requested` | `step`, `tool`, `args`, `key` | **Intent**, recorded *before* the effect. |
| `tool_succeeded` | `step`, `key`, `result` | Effect applied. |
| `tool_failed` | `step`, `key`, `error` | Effect attempted and failed. Compacted. |
| `claimed_done` | `step`, `summary` | The agent asserts completion — a claim, not a fact. |
| `run_stopped` | `reason`, `at` | Brackets the run. Last line, exactly once. |

### Invariants

1. **Append before acting.** `tool_requested` is written before the tool runs.
2. **Every request gets exactly one outcome** — `tool_succeeded` or `tool_failed`,
   matched by `key`.
3. **A request with no outcome means the process died mid-call.** Recovery must
   complete it before requesting a new decision. Skipping this loses work silently;
   see the bug documented in `README.md`.
4. **Replay is deterministic.** The fold uses only logged data — no ambient clock,
   no unlogged randomness, no re-reading of mutable external state.
5. **The log is never edited.** Compaction (Ch.4) compacts the *context*, never
   the log. The log is the audit trail; a rewritten log cannot be trusted for
   recovery or for Ch.8's traces.

## 3. Idempotency

Every side-effecting call carries a `key`. The reference implementation uses
`{step}:{tool}:{args}`.

- Before applying, check whether `key` is already in the applied set.
- The applied set is derived from the log, not held in memory.
- A key must be stable across a replay: the same logical call must produce the
  same key on a resumed run, or the dedupe silently fails open.

This is what makes at-least-once delivery survivable. Exactly-once is not
available; at-least-once plus idempotent handlers is the achievable approximation.

## 4. Stopping conditions

At least four, checked before every iteration:

| Reason | Catches |
|---|---|
| `goal_satisfied` | The work is done — **and verified**, not merely claimed |
| `step_budget_exhausted` | Unbounded loops |
| `token_budget_exhausted` | Context and cost runaway |
| `no_progress` | Thrashing — the last N calls were identical |

`human_halt` is reserved. Ch.7 adds a cost budget; Ch.10 adds the check that
refuses a premature `claimed_done`.

**`claimed_done` is a claim.** It becomes `goal_satisfied` only after verification.
Ch.10's version verifies in a *fresh* context against the original goal, so a
model that has talked itself into believing it finished does not get to grade the
question it was confused by.

## 5. Error compaction

On failure, append a single compacted line: the message, truncated, with no stack
dump. The same error twice in a row is recorded once in the transcript.

An error message is a prompt (Ch.5). `"404"` teaches the next iteration nothing;
`"no user id=X; use search_users(email)"` teaches it the recovery.

## 6. The model provider

One function:

```
decide(state, tools) -> { decision, tokens }
decision = { kind: "call_tool", tool, args } | { kind: "done", summary }
```

Everything else in the harness is provider-agnostic. If your port needs to change
anything but this function to swap providers, the seam is in the wrong place.

## 7. Not yet specified

Deliberately open, and specified by the chapter that introduces them:

- **Context policy** (Ch.4) — what the model sees, and the retention contract
  compaction must honor.
- **Cache layout** (Ch.7) — where the cache breakpoint sits relative to the above.
- **Trace spans** (Ch.8) — should follow OTel GenAI semantic conventions rather
  than anything invented here.
- **Permissions** (Ch.9) — blast-radius classification and approval gates.
- **Handoff artifact** (Ch.10) — schema for `HANDOFF.md`: goal, constraints,
  decisions and why, what failed, current state, next action, open questions.
