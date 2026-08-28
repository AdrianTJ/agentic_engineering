# The reference harness

A runnable skeleton the curriculum's exercises attach to, so you are not starting
from an empty file twelve times.

```sh
node harness.ts          # run it
./verify.sh              # prove it does what the chapters claim
CRASH_AT=3 node harness.ts && node harness.ts   # kill it, watch it resume
rm -rf .state            # start over
```

Requires **Node 22.6+**, which runs TypeScript directly. **No dependencies, no
network, no API key** — the model is a deterministic stub, so the loop is
inspectable and the whole thing runs offline in about a second. That is the
point: you should be able to read the entire control flow before you have
spent any money.

## What it implements, and what it deliberately doesn't

| | Chapter | Status |
|---|---|---|
| The loop, four stopping conditions, error compaction | Ch.2 | **implemented** |
| Stateless reducer, event log, crash recovery, idempotency | Ch.6 | **implemented** |
| Context policy — compaction, notes, clearing | Ch.4 | **implemented, as the worked seam** |
| Real tool schemas and descriptions | Ch.5 | `SEAM(Ch.5)` |
| Cost accounting and cache layout | Ch.7 | `SEAM(Ch.7)` |
| Verification, traces, evals | Ch.8 | `SEAM(Ch.8)` |
| Sandboxing, permissions, approval gates | Ch.9 | `SEAM(Ch.9)` |
| Handoff artifacts, context reset, evaluator split | Ch.10 | `SEAM(Ch.10)` |
| A real model provider | Ch.11 / Ch.12 | `SEAM(Ch.11 / Ch.12)` |

Ch.4 is implemented rather than stubbed for a different reason: it is the
**worked seam**, the example the other attachment points follow. If you are about
to attach a permission model or a trace exporter, read how the context policy
attaches first.

Grep for `SEAM(` to find every attachment point. **The gaps are the curriculum** —
this file is a scaffold with the interesting parts removed on purpose, not a
framework to adopt.

Chapters 2 and 6 are implemented rather than stubbed because everything else
needs somewhere to stand: without a loop that terminates and a log that survives
a crash, there is nothing to attach a context policy or a permission model to.

## Why the model is fake

Swapping in a real provider is one function — `ModelProvider.decide`. Everything
else in the file is provider-agnostic, which is the actual lesson: **almost none
of a harness is about the model.** The stub also makes the exercises reproducible.
When you measure a context policy in Ch.4 or a cache layout in Ch.7, you want the
model held constant, and a scripted stub is the only way to get that for free.

Three scripts are built in, so the stopping conditions can be exercised:

```sh
node harness.ts                  # completes normally
SCRIPT=thrash node harness.ts    # repeats one call — trips no-progress detection
SCRIPT=long   node harness.ts    # never finishes — trips the step budget
```

## The context policy, and what measuring it revealed

`buildContext()` is the only function that decides what the model sees. The
transcript is raw history; the context is a derived, budgeted view of it.
Conflating those two is the most common Ch.4 mistake, so the code keeps them
separate and the run prints an occupancy report broken down by category.

Three policies, so the Ch.4 exercise is a command rather than a project:

```sh
POLICY=none    SCRIPT=long node harness.ts   # no policy
POLICY=compact SCRIPT=long node harness.ts   # compaction only
POLICY=full    SCRIPT=long node harness.ts   # compaction + tool clearing + notes
```

Measured, on the same 20-step task:

| Policy | Final occupancy | Compactions | Tokens billed |
|---|---|---|---|
| `none` | **105%** — overflows | 0 | 4,727 |
| `compact` | 70% | 2 | 3,943 |
| `full` | 69% | **0** | **3,570** |

**Tool clearing alone reached the same occupancy as compaction, billed 9% fewer
tokens, and never had to compact at all.** The cheap, non-lossy technique beat the
expensive, lossy one on this workload.

The mechanism is visible in the per-category breakdown: after two compactions the
`retained` contract block had grown to 169 tokens against 36 tokens of surviving
history. Compaction moved most of the cost rather than removing it — the contract
is the part you promised not to drop, so it accumulates. Ch.7's point lands here
too: each compaction also rewrites the prefix, so a real provider would have
invalidated the cache twice for a saving that tool clearing got for free.

This is not an argument that compaction is wrong. It is an argument for
**reaching for eviction before summarization**, and for measuring rather than
assuming — which is exactly what Ch.4's exercise asks you to do, and why the
numbers above come from `verify.sh` rather than from prose.

## A bug this skeleton shipped, and what it teaches

The first working version passed a naive crash test and was still wrong.

Crashing at step 3 left a `tool_requested` event in the log with no corresponding
outcome — the process died between recording the intent and applying the effect.
On resume, the harness rebuilt state correctly, saw it was at step 3, and asked
the model for a fresh decision. The model, being at step 3, returned step 3's
*next* action. **The interrupted call was silently dropped**, and the run finished
reporting success with one of its two notes missing.

Nothing errored. The log looked healthy. The only symptom was a missing line in a
file nobody was diffing.

This is precisely the subtlety Ch.6 raises — append before the effect, and then
you *must* handle the window between them — and it is why `State` now carries a
`pending` field and the loop completes an interrupted call before consulting the
model again. `verify.sh` asserts the fix by comparing post-crash side effects
against a clean run, byte for byte.

The general lesson is the one Ch.8 makes: a crash test that only checks "did it
resume" is verification theater. It has to check *what the work produced*.

## Layout

```
harness.ts     the skeleton — types, event log, reducer, loop, stub model
verify.sh      8 assertions, each corresponding to a claim made in a chapter
SPEC.md        the contracts, language-neutral, for the Rust track and your own port
.state/        created at runtime: events.jsonl and NOTES.md (gitignored)
```

`SPEC.md` matters if you are doing Ch.12: it defines the event log and workspace
contracts in language-neutral terms, so a Rust implementation and this one can
read each other's logs.
