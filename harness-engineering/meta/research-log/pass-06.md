# Research log — pass 06 (2026-08-28)

Two queries, two builds, one retraction.

## Queries

| # | Query | Gap |
|---|---|---|
| 1 | `empirical study long-horizon coding agent session length human intervention rate measured` | #4 audit Ch.10 |
| 2 | (fetch) `arxiv.org/abs/2606.26959` — Codex usage study | #4 |

## Findings

### SlopCodeBench (query 1 → Ch.10 core) — the source that disagrees

arXiv 2603.24755. Chains agent output across checkpoints, scores quality at every
step. Across **11 models and 20 iterative problems, no agent solved a problem
end-to-end.** Degradation resumes at the same rate regardless of initial quality
— a better start buys distance, not immunity.

Ch.10 previously rested on four practitioner accounts that agree with each other.
This is the first source in the chapter that pushes back, and it changes the
chapter's advice: the handoff is not an edge case, it is the expected terminus.

### METR: Measuring AI Ability to Complete Long Tasks (→ Ch.10 core)

arXiv 2503.14499. Scores *task length in human time at a stated reliability*
rather than pass/fail, producing a task-completion horizon.

**Six passes in and this had never surfaced.** That is a real gap in my searching:
it is the paper that makes this curriculum's central adjective measurable, and I
was searching for harness/agent terms rather than for how anyone quantifies
"long". Worth remembering that a missing source can be missing because of the
vocabulary you searched in.

Added to the glossary as **task-completion horizon**, and to Ch.10's check-yourself
as: state a capability claim about your harness in METR's form — what task length,
at what reliability?

### Codex usage study (query 2 → Ch.10 deeper)

One number worth keeping: **requests for tasks requiring 8+ hours rose ~10×** in
H1 2026, and >10% of users ran three or more concurrent agents weekly. Long-horizon
supervision is the common case now.

Several numbers worth discounting, and the chapter says so: the productivity
multiples (13× legal, 50× research) are token-output counts from the vendor's own
staff. Output tokens are not delivered value.

## Build: per-value provenance

Pass 05's run-wide taint bit was flagged as coarse. In use it was **unusable** —
one `read_file` denied all egress for the rest of the run, permanently. A control
nobody can operate gets switched off.

| Script | Behaviour |
|---|---|
| `exfil` | payload carries untrusted data → **DENIED** |
| `benign` | untrusted read, unrelated payload → **allowed** to the approval gate |
| `launder` | paraphrased untrusted data → **gets through** (documented limit) |

`benign` is the case pass 05 got wrong. `launder` is the case this version gets
wrong, and `verify.sh` asserts the bypass so it cannot be silently "fixed" without
a deliberate re-baseline. Documenting a control's failure mode as a test is worth
more than documenting it as a sentence.

## Build: the Ch.3 routing seam

`route()` handles a sequential scan statically. 20 model calls → 1; 3,935 tokens
→ 92; identical files touched (asserted).

The caveat is in the README and in Ch.3, because the number alone is misleading:
a sequential scan is the most routable case that exists. What transfers is the
per-edge question — *what would you have to enumerate to make this static?* — not
the 97%.

## Retraction: pass 05's reading-time measurement

Pass 05 concluded the `~N min` estimates were random noise, with a table.

**The measurement was wrong.** It counted whole-page text including nav and footer
boilerplate, which inflates short posts proportionally more than long ones — the
scatter was manufactured by the method.

Re-measured on body text only (`<article>`/`<main>`, boilerplate stripped):

| Source | Est. | Body words | Implied wpm |
|---|---|---|---|
| Building effective agents | 25 | 2,791 | 112 |
| Effective context engineering | 35 | 3,178 | 91 |
| Writing effective tools | 35 | 3,335 | 95 |
| Art of loop engineering | 20 | 1,366 | 68 |
| Harness eng. for self-improvement | 45 | 6,769 | 150 |
| Anatomy of an agent harness | 20 | 2,452 | 123 |
| Harness design long-running | 40 | 5,309 | 133 |
| Building LangGraph | 30 | 4,230 | 141 |
| The lethal trifecta | 10 | 1,618 | 162 |

Mean ≈ 120 wpm — consistent, and a defensible careful-reading rate. Spread 68–162
means ±35% on any single figure, so they are loose but not arbitrary.

Recorded in the README as a correction rather than a silent edit. The transferable
part is not the numbers: **the first measurement was confidently wrong in a way
that looked like data.**

## Validation

- `check-links.sh`: 114 sources, **102 OK / 12 WARN / 0 FAIL**
- `check-coverage.sh`, `check-refs.sh`: passing
- `verify.sh`: **29/29** (was 23), baseline updated deliberately
