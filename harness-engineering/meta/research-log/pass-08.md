# Research log — pass 08 (2026-08-28)

No queries. No new sources. One ordered read of the whole curriculum, front to
back, which nobody had done — including me.

## Method

1. Read `README.md` in full.
2. Computed the reading-time totals rather than trusting the quoted ones.
3. Grepped for figures known to be at risk (superseded pass-04 numbers, assertion
   counts, "eviction before summarization", `SEAM(` claims).
4. Re-ran every measurement the docs quote.
5. Read chapters in order, checking cross-references and promises.
6. Read `ASSESSMENT.md` against what the harness now implements.

Step 4 was the one that mattered, and it was almost skipped. The numbers *looked*
fine.

## The main finding: silent numeric drift

Every published figure about the harness was stale.

Mechanism: passes 05 and 07 added `post_webhook` and `escape_workspace` to
demonstrate security seams. Tool definitions live in the context, so the tools
block grew from 58 to 95 tokens — and **every token count in four chapters moved**
while all 34 assertions kept passing, because no assertion knew the prose existed.

| Figure | Was | Is |
|---|---|---|
| Ch.3 dynamic tokens | 3,935 | 4,265 |
| Ch.3 routed tokens | 92 | 110 |
| Ch.4 `compact` billed | 1,939 | 2,080 |
| Ch.4 `clear` billed | 2,358 | 2,384 |
| Ch.5 tool cost | 58 / 14.5% | 95 / 23% |
| README assertions | 8 | 34 |
| Ch.11 assertions | 15 | 34 |

Qualitative conclusions all survived. That is luck, not design — the `clear`/
`compact` inversion is a 15% gap and could have closed.

### Why prose drifts and code doesn't

The harness has 34 assertions. The prose had none. Every check built so far
validated the *reading list* (links, coverage, refs) and none validated the
*claims*.

Fix: `measure.sh` generates `MEASUREMENTS.md`; `bin/check-numbers.sh` fails if any
chapter disagrees with it; the reference-harness README stops restating tables and
links instead. Deduplication is the durable half — a number that exists in one
place cannot disagree with itself.

Building the checker immediately caught a bug in itself (column indices off by
one, because `awk -F'|'` on a leading-pipe table shifts every field), and then
caught a real one: the top-level README still advertised 8 assertions.

## Second finding: the assessment had rotted

Ch.3, Ch.7 and Ch.9 tasks asked the reader to build the router, cache accounting,
and the policy engine — all implemented in passes 06–07. Three of twelve tasks
were descriptions of existing code.

Rewritten to point past the artifact. Two now target genuinely open questions:
token-granular cache modelling (Ch.7) and the laundering bypass (Ch.9). Better
place for them than a gap list — a reader who resolves one has done something the
curriculum could not.

## What a read catches that a grep cannot

- "roughly a million lines" appeared twice in one Ch.1 paragraph. A pass-02 splice.
  Six passes, no notice.
- Ch.1 promised the inventory would be revised after Ch.4, 6, 8, 9. Only Ch.9
  asked. Fixed by making the other three ask — the inventory is now a real
  through-line rather than a dropped thread.
- "one chapter per part" of six primitives, in a twelve-chapter curriculum.
- Ch.2: harness "implements exactly this chapter" — true in pass 03, false since.
- README seam list: claimed 2 chapters implemented, actually 6.
- The context-tension paragraph still described Ch.7 as *predicting* a cache cost,
  written before Ch.7 measured it and found compaction wins.
- Reading ladder quoted from memory: "≈6h" for a set that sums to 8.7h.

Seven real defects, none findable by any checker that existed, all findable by
reading in order. The cheapest pass so far and among the most productive.

## Validation

- `check-links.sh`: 114 sources, 102 OK / 12 WARN / 0 FAIL
- `check-coverage.sh`, `check-refs.sh`, **`check-numbers.sh`**: passing
- `verify.sh`: 34/34

## Closed within the pass

`check-numbers.sh` compared prose against `MEASUREMENTS.md` without checking that
the generated file was itself current. It now fails when `harness.ts` or
`verify.sh` is newer than it, verified by touching the source and confirming
exit 1.

Worth recording: my first attempt to confirm that exit code piped through `head`
and read *head's* status, so a working guard looked broken. **This is exactly the
mistake I made in pass 05 testing the regression gate.** Knowing a failure mode
does not stop you repeating it; only the habit of checking `$?` without a pipe
does.
