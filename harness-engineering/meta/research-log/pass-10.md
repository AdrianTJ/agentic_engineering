# Research log — pass 10 (2026-08-28)

No queries, no new sources. A prose pass, prompted by the first external
feedback the curriculum has received: content fine, prose choppy, too many em
dashes, and please emulate Ben Thompson.

## Two things fetched before writing

1. A Stratechery article, for the construction habits: sentences of fifteen to
   twenty words that connect, semicolons and parentheses where the dashes had
   been, and topic sentences that state the point.
2. Simon Willison's LLM cliché highlighter source
   (`raw.githubusercontent.com/simonw/tools/main/llm-cliche-highlighter.html`),
   for its 38 rules. Ported the pattern list into `bin/check-style.py`, keeping
   Willison's symptoms-not-proof framing: hard-fail the patterns that are never
   fine here, warn on the judgment calls.

## Numbers

| | Baseline | After |
|---|---|---|
| Em dashes (total) | 587 | 90 |
| Em dashes (prose, non-structural) | ~492 | ~0 |
| Hard style failures | 3 | 0 |

The 90 residual dashes are all structural: titles, the core-question
blockquotes, and the `Source — Author · ~N min` citation headers.

## Stale facts a rewrite surfaced

Rewriting a sentence makes you re-check it. Four fixes fell out that nine
content passes had missed:

- Ch.2 said the loop was the first 80 lines of `harness.ts`; false since the
  pass 09 modularization.
- Ch.4 called the cache-granularity question open; pass 09 answered it.
- Ch.9 described a taint bit; pass 06 replaced it with per-value provenance.
- Ch.11 cited 34 verify.sh assertions; the suite has 42.

## The checker is now enforced

`check-style.py` runs inside `check-all.sh`, which the pre-commit hook runs, so
a reintroduced hard tell blocks the commit. Verified the wiring by running the
full suite: fails=0, ALL CHECKS PASSED.

## Order of work

Twelve chapters rewritten front to back, committed in pairs so each commit
stayed reviewable and the hook validated each one. Then README, glossary, and
assessment, so a reader crossing from a chapter into the front matter does not
hit the old register. The glossary's 99 term-dash entries became the same
`Term. Sentence.` form the chapter Key Concepts already used.

## What did not get touched

The reference-harness code comments and `SPEC.md`. They are code commentary
rather than curriculum prose, and left for a later pass.
