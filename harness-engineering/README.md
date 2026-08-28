# Harness engineering — a curriculum for long-horizon agents

A reading curriculum, not a framework tutorial. The subject is the **harness**:
the system around a base model that decides how it thinks, what it can touch,
what it remembers, when it stops, and how anyone knows whether it worked.

The organizing claim, which every chapter tests from a different angle:

> Reliability on long-horizon tasks is a property of the **model–harness–environment**
> system, not of the weights. A well-built harness can make a weaker model outperform
> a stronger one that is poorly scaffolded.

**Long-horizon** here means a task whose work exceeds one context window, one
process lifetime, or one human sitting: a multi-day migration, a repo-wide refactor,
a research sweep, an on-call agent that must still be coherent at hour nine.
Everything hard about these tasks is a harness problem.

## How to use this

Twelve chapters. Each is a **map plus a reading list**, not a replacement for the
reading. The chapter text tells you what the sources say, why the source is on
the list, what to argue with, and what to build. The sources do the teaching.

Each chapter has the same shape:

| Section | What it is |
|---|---|
| **The problem** | The failure this chapter's ideas exist to prevent |
| **Core reading** | 4–8 pieces. Non-negotiable. Time-estimated. |
| **Going deeper** | Optional depth, papers, primary specs |
| **Key concepts** | The vocabulary you should own after reading |
| **Build this** | A concrete exercise that forces the idea into your hands |
| **Check yourself** | Questions you should be able to answer without notes |

### About the time estimates — measured, then re-measured

Each core reading carries a `~N min`. Pass 05 measured these and concluded they
were random noise. **Pass 06 found that measurement was wrong** and the conclusion
with it: the word counts included navigation and footer boilerplate, which
inflated some pages far more than others and manufactured the scatter.

Re-measured against body text only (preferring `<article>`/`<main>`, stripping
script/style/nav/header/footer):

| Source | Estimate | Body words | Implied rate |
|---|---|---|---|
| Building effective agents | 25 min | 2,791 | 112 wpm |
| Effective context engineering | 35 min | 3,178 | 91 wpm |
| Writing effective tools | 35 min | 3,335 | 95 wpm |
| The art of loop engineering | 20 min | 1,366 | 68 wpm |
| Harness engineering for self-improvement | 45 min | 6,769 | 150 wpm |
| Anatomy of an agent harness | 20 min | 2,452 | 123 wpm |
| Harness design for long-running apps | 40 min | 5,309 | 133 wpm |
| Building LangGraph | 30 min | 4,230 | 141 wpm |
| The lethal trifecta | 10 min | 1,618 | 162 wpm |

The estimates are **internally consistent, implying ~120 wpm on average** — a
defensible rate for careful reading of technical prose, as against the ~200 wpm
usually quoted for skimming. So they are not arbitrary.

They are still loose: the implied rate ranges from 68 to 162 wpm, so any single
estimate carries roughly ±35%. The outlier at the slow end (loop engineering) is
a short piece whose value is a taxonomy worth pausing over, which is arguably
correct rather than an error.

Use them as relative weight with a third of slack, not as a schedule. And note
what happened here: the first measurement was confidently wrong in a way that
looked like data. Measuring the wrong thing carefully still gives you a wrong
answer.

## Reading ladder

Three passes, depending on how much time you have.

These totals are summed from the per-source estimates, which the section above
tells you carry about ±35%. They were also wrong in an earlier version — quoted
from memory rather than added up — so they are now computed.

**Weekend (≈9h).** Ch.1 core → Ch.2 core → Ch.4 core → Ch.5 core. This is the
minimum that lets you read someone else's harness and say something true about it.

**Two weeks (≈28h + exercises).** Chapters 1–10 core reading, one exercise per
chapter, plus whichever of 11/12 matches your language (≈3h more). Budget real
time for the exercises; they are where the curriculum actually lands.

**Full (≈33h core, plus *Going deeper*, both language tracks, twelve exercises and
the capstone).** Call it 70–80 hours if you do all of it properly. Nobody has,
including its author — see `PROVENANCE.md`.

## The chapters

| # | Chapter | Core question |
|---|---|---|
| [01](chapters/01-foundations.md) | Foundations: what a harness is | Where does reliability actually come from? |
| [02](chapters/02-the-loop.md) | The loop | What runs, and when does it stop? |
| [03](chapters/03-graphs-and-control-flow.md) | Graphs & control flow | Who decides the next step — you or the model? |
| [04](chapters/04-context-and-memory.md) | Context & memory | How does work survive a context window? |
| [05](chapters/05-tools-and-definitions.md) | Tools & their definitions | What is the contract between a deterministic system and a non-deterministic caller? |
| [06](chapters/06-state-durability-resumption.md) | State, durability, resumption | How does work survive a *crash*? |
| [07](chapters/07-cost-and-caching.md) | Cost, caching & economics | What does all of the above cost, and what has to give? |
| [08](chapters/08-verification-and-evals.md) | Verification, evals & observability | How do you know it worked? |
| [09](chapters/09-security-and-sandboxing.md) | Security, sandboxing & permissions | What is the blast radius? |
| [10](chapters/10-long-running-operations.md) | Long-running operations & the human interface | Six hours in — what does the harness owe the person watching? |
| [11](chapters/11-typescript-harness.md) | TypeScript harness engineering | Building it where the ecosystem lives |
| [12](chapters/12-rust-harness.md) | Rust harness engineering | Building it where the guarantees live |

Three chapters form a running argument you should read as one. Ch.4 says compact
the context. Ch.7 says compaction rewrites the prefix and rewriting invalidates
the cache — **and then measures it, and finds compaction still wins on billed
cost**, because what you pay for is the part that changes, not the whole context.
Ch.10 says the teams running the longest tasks reset the context entirely rather
than compacting.

The harness now measures all three, and the result is a caution rather than a
verdict: compaction bills least, reset most — **but the measurement only captures
cost**, and Ch.10's case for reset is that it prevents a failure this harness's
scripted model cannot exhibit. Reset also turned out not to escape the retention
problem at all; it relocates it into a file, where at least you can read what was
dropped.

Nobody has settled it. Read all three before you commit to a context policy, and
treat any one of them — or any cost-only table, including this repository's — as
an argument rather than an answer.

## The reference harness

[`reference-harness/`](reference-harness/) is a runnable skeleton the exercises
attach to, so you are not starting from an empty file twelve times:

```sh
node harness.ts                                  # run it (Node 22.6+, no deps)
reference-harness/verify.sh                      # 42 assertions from the chapters
CRASH_AT=3 node harness.ts && node harness.ts    # kill it, watch it resume
./run-sandboxed.sh SCRIPT=escape                 # containment, not just policy
```

Seven chapters are implemented in it — **Ch.2** (loop, stopping conditions),
**Ch.3** (static routing), **Ch.4** (context policy), **Ch.6** (event log, crash
recovery), **Ch.7** (cache accounting), **Ch.9** (policy engine, containment),
**Ch.10** (handoff artifact, context reset). Ch.5 and Ch.8 remain marked
`SEAM(Ch.N)`. One module per chapter, so a chapter points at a file. **The gaps are the curriculum**;
this is a scaffold with the interesting parts removed on purpose, not a framework
to adopt.

The model is a deterministic stub, so it runs offline in a second and your
measurements in Ch.4 and Ch.7 hold the model constant.

Every figure the chapters quote about the harness lives in
[`reference-harness/MEASUREMENTS.md`](reference-harness/MEASUREMENTS.md), which is
**generated**, not written. `bin/check-numbers.sh` fails if the prose has drifted
from it — a check that exists because the numbers went stale twice before anyone
looked.

## Scope

What this curriculum covers: the system **around** a fixed model. What it
deliberately excludes: anything that changes the weights — RL for long-horizon
competence, fine-tuning, reward design. That work is real and it is adjacent, but
it answers a different question ("how do we make the model better at this?")
rather than this one ("how do we get reliable work out of the model we have?").
Where a source crosses the line — Weng's joint optimization with model weights,
Meta Context Engineering's learned skills — the chapter says so and stays on this
side of it.

Supporting material:

- [`ASSESSMENT.md`](ASSESSMENT.md) — one objective task per chapter, against the reference harness. The *Check yourself* questions have no answer key by design; this is the substitute, and a better test.
- [`GLOSSARY.md`](GLOSSARY.md) — terms the field uses inconsistently, pinned down
- [`SOURCES.md`](SOURCES.md) — the full annotated bibliography, one row per source
- [`sources.tsv`](sources.tsv) — the same list, machine-checkable
- [`PROVENANCE.md`](PROVENANCE.md) — how this curriculum was built, pass by pass
- [`meta/research-log/`](meta/research-log/) — raw findings from each research pass

## Validating the reading list

Link rot is the failure mode of any curriculum. Every URL cited here is in
`sources.tsv` and checkable:

```sh
bin/check-all.sh                  # all of the below, in dependency order
bin/check-all.sh --links          # …plus link rot (slow: ~114 network requests)
bin/install-hooks.sh              # run check-all.sh on every relevant commit
```

Individually:

```sh
reference-harness/measure.sh      # regenerate MEASUREMENTS.md (run this first)
reference-harness/verify.sh       # the harness does what the chapters claim
bin/check-refs.sh                 # every Ch.N reference points at a real chapter
bin/check-coverage.sh             # every cited URL is registered in sources.tsv
bin/check-numbers.sh              # every quoted measurement matches the harness
bin/check-links.sh                # every source still resolves
```

Each exists because something went wrong that it would have caught — including
`check-all.sh` itself, which exists because pass 09 pushed a commit with
`check-numbers.sh` red. The checkers were run by discipline; discipline is what
failed. Coverage came
from a bare link that escaped the link checker; refs from a renumber that stranded
three cross-references; numbers from published figures that went stale twice.

A `403` from the link checker is usually an egress policy or a bot filter rather
than a dead link — `SOURCES.md` records which sources reject automated fetchers
and how each was verified instead.

## A caveat worth stating up front

This field is roughly two years old and its vocabulary is not settled. "Harness",
"scaffold", "agent", and "workflow" are used for overlapping and sometimes
contradictory things across the sources here. Chapter 1 and the glossary fix a
vocabulary for this curriculum; expect the sources to deviate from it, and read
the deviation as information about the author's priorities rather than as an error.
