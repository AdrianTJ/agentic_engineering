# Research log — pass 07 (2026-08-28)

Zero queries. Every gap was about the harness, not the reading — the first pass
where that was true.

## Build: cache accounting, and the correction it forced

The curriculum's central tension (Ch.4 says compact, Ch.7 says compaction breaks
your cache) had never been priced, because the harness billed raw tokens only.

`cacheSplit()` fingerprints each context block and compares against the previous
turn; the cached prefix ends at the first block that differs. Cached input bills
at 0.1x.

| Policy | Compactions | Hit | Raw | Billed |
|---|---|---|---|---|
| none | 0 | 34% | 5,107 | 3,530 |
| compact | 3 | 59% | 4,168 | **1,939** |
| clear | 1 | 44% | **3,935** | 2,358 |
| full | 1 | 44% | 3,935 | 2,358 |

Deterministic across runs.

**This inverts pass 04.** That pass measured raw tokens, found tool clearing
cheaper, and Ch.4 has advised "reach for eviction before summarization" ever
since. Under billing, tool clearing costs 22% more.

Mechanism: **billed cost tracks the size of the part that changes.** Compaction
shrinks the volatile tail; tool clearing keeps a mid-sized history churning, and
a moderate block re-billed every turn beats a large block billed once.

### What I did not do

Declare victory. The cache model is **block-granular**; real providers are
token-prefix granular. Under that model an append-only history stays mostly
cached (favouring `clear`) while compaction's rewrite of an early block
invalidates everything after it (also favouring `clear`). **A realistic model
might restore pass 04's ranking.**

Ch.7 and the README now state this as an open question and set re-deriving it as
the exercise. Two passes in a row have corrected an earlier confident conclusion;
replacing this one with an equally confident new one would have earned a third.

### A methodological near-miss

`full` differs from `compact` in two ways — tool clearing *and* the notes block —
so the first version of the comparison was confounded. Added `clear` (= `full`
minus notes) to isolate the variable. On this script the confound is inert
(`clear` and `full` are byte-identical, because `SCRIPT=long` never writes a
note), so the original comparison happened to be valid. That was luck. The
isolating policy stays, because the next comparison may not be lucky.

## Build: containment

Ch.9's seam authorized but never contained.

```
SCRIPT=escape node harness.ts      → policy permits → /tmp/escaped-the-workspace.txt written
./run-sandboxed.sh SCRIPT=escape   → runtime denies → nothing written
```

`escape_workspace` is deliberately classified as a benign `write` so
authorization passes it. Only containment stops it. Both asserted.

**What this is and isn't**: Node's permission model, `--allow-fs-write` scoped to
`.state/`. A *runtime* boundary — stronger than an in-tool path check (the tool
can skip its own check), weaker than a container (no CPU, memory, network, or
syscall bounds). This environment has a Docker client and no daemon; claiming
containerization would be verification theater by Ch.8's own definition.

Nice emergent behaviour: the runtime denial arrives as a normal tool failure, is
error-compacted by Ch.2's loop, and trips no-progress detection. Three chapters'
mechanisms composing without any of them knowing about the others.

## Validation

- `verify.sh`: **34/34** (was 29), re-baselined deliberately
- `check-links.sh`: 114 sources, 102 OK / 12 WARN / 0 FAIL
- `check-coverage.sh`, `check-refs.sh`: passing

## Note to pass 08

Two open technical questions are now stated in the curriculum rather than
resolved: token-granular cache modelling, and whether laundering is fixable
without an interpreter. Stating them is better than faking answers, but they
should not become permanent furniture.

The cheapest high-value item is one nobody has done: **read the whole thing end
to end.** Seven passes of local edits, no coherence pass.
