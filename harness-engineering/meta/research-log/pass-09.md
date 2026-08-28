# Research log — pass 09 (2026-08-28)

No queries. Three builds and one answered question. Committed incrementally.

## Branch

Renamed `claude/long-horizon-agent-curriculum-vyi1ka` → `feat/long-horizon-textbook`.
No open PRs, so retiring the old name closed nothing. **The old remote branch
could not be deleted** — both `--delete` and the `:branch` refspec are refused by
this environment's git proxy (`remote end hung up`). Reported rather than routed
around; the ref is harmless and points at the same commit.

## Build: modularization

850 lines → `harness.ts` (~190, the loop) plus ten modules in `src/`, one per
chapter concern.

The safety net was the point: refactor under the 34-assertion suite, then
regenerate `MEASUREMENTS.md` and confirm it came out **byte-identical**. Without
the measurement harness built in pass 08, "I think the refactor was safe" is all
anyone could have said.

## Build: the Ch.10 seam, and its bug

`POLICY=reset` — clear the window at threshold, continue from `HANDOFF.md`.

**The bug.** No bound on the artifact. *Done* listed every completed effect, so:

```
661 bytes → 949 bytes across one run
10 resets in 20 steps
billed 3,104
```

The handoff became the thing filling the window. And `src/handoff.ts` says, in
its own docstring, "a handoff that accumulates is just a transcript with extra
steps" — written in the same commit as the code that accumulated.

Bounding *Done* to the last five: 5 resets, billed 2,578, artifact stable at
~560 bytes.

**The finding**: a context reset does not escape the retention problem, it
relocates it. Compaction drops things inside an opaque summary; a handoff drops
them in a file you can read. Auditable, not free.

**What the numbers don't say**: reset bills more than compaction, but the stub
model is scripted on step number and cannot lose coherence — the failure Ch.10
says reset prevents. The measurement is cost-only, i.e. half an argument. Both
READMEs and `MEASUREMENTS.md` say so.

## Answered: the cache-granularity question

Pass 07 flagged that its block-granular cache model might not survive contact with
prefix-granular reality. `CACHE_MODEL=chunk` (40-char chunks) measures it.

| Policy | block | chunk |
|---|---|---|
| none | 3,586 | **1,106** |
| compact | 2,080 | **1,063** |
| clear | 2,384 | 1,469 |
| reset | 2,578 | 1,883 |

Ordering survives. **Magnitude collapses**: no-policy goes from 3.4× compaction to
1.04×, because an append-only context caches almost perfectly and every mutation
forfeits that.

Conclusion the curriculum did not set out to reach: **on cost alone, context
engineering barely pays.** Its case rests on occupancy (no-policy overflows the
window and is unusable at any price) and coherence (unmeasurable here). Ch.7 now
warns against justifying a context policy on token cost without measuring at
realistic granularity.

Next question down, now the Ch.7 assessment task: a 40-char chunker is not a
tokenizer, and real caches have minimum block sizes and TTLs.

## Process failure

The third commit was pushed with `check-numbers.sh` **red**. Its staleness guard —
added last pass for precisely this case — said `verify.sh` was newer than
`MEASUREMENTS.md`. I committed anyway.

Only the assertion count was stale, so nothing published was wrong. That is luck,
not mitigation. Fixed in the following commit, recorded rather than amended away.

**A validator you ignore is worse than one you never built**: same cost, no
benefit, plus false confidence. Nothing enforces these checkers — they run by
discipline, and this pass is the evidence on how far that goes. A pre-commit hook
is now the top gap, and the only one on the list demonstrated necessary by
evidence rather than argued for.

## Validation

- `verify.sh`: **42/42** (was 34)
- `check-links.sh`: 114 sources, 102 OK / 12 WARN / 0 FAIL
- `check-coverage.sh`, `check-refs.sh`, `check-numbers.sh`: passing
