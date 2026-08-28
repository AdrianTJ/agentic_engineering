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
| **Core reading** | 3–6 pieces. Non-negotiable. Time-estimated. |
| **Going deeper** | Optional depth, papers, primary specs |
| **Key concepts** | The vocabulary you should own after reading |
| **Build this** | A concrete exercise that forces the idea into your hands |
| **Check yourself** | Questions you should be able to answer without notes |

Read in order for chapters 1–10; they build. Chapters 11 and 12 (TypeScript, Rust)
are parallel implementation tracks — read whichever language you'll actually
write in, or both to see how the same primitives land differently.

## Reading ladder

Three passes, depending on how much time you have.

**Weekend (≈6h).** Ch.1 core → Ch.2 core → Ch.4 core → Ch.5 core. This is the
minimum that lets you read someone else's harness and say something true about it.

**Two weeks (≈25h).** Chapters 1–10 core reading, one exercise per chapter, plus
whichever of 11/12 matches your language.

**Full (≈75h).** Everything, including *Going deeper*, both language tracks, and
the capstone in Chapter 12.

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

Three chapters form a running argument you should read as one: Ch.4 says compact
the context, Ch.7 says compaction breaks your cache, and Ch.10 says the teams
running the longest tasks reset the context instead. Nobody has settled it. Read
all three before you commit to a context policy.

## The reference harness

[`reference-harness/`](reference-harness/) is a runnable skeleton the exercises
attach to, so you are not starting from an empty file twelve times:

```sh
node harness.ts                                  # run it (Node 22.6+, no deps)
reference-harness/verify.sh                      # 8 assertions from the chapters
CRASH_AT=3 node harness.ts && node harness.ts    # kill it, watch it resume
```

It implements Ch.2 and Ch.6 in full — a loop that terminates and a log that
survives a crash, because everything else needs somewhere to stand. Every other
chapter attaches at a marked `SEAM(Ch.N)`. **The gaps are the curriculum**; this
is a scaffold with the interesting parts removed on purpose, not a framework to
adopt.

The model is a deterministic stub, so it runs offline in a second and your
measurements in Ch.4 and Ch.7 hold the model constant.

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

- [`GLOSSARY.md`](GLOSSARY.md) — terms the field uses inconsistently, pinned down
- [`SOURCES.md`](SOURCES.md) — the full annotated bibliography, one row per source
- [`sources.tsv`](sources.tsv) — the same list, machine-checkable
- [`PROVENANCE.md`](PROVENANCE.md) — how this curriculum was built, pass by pass
- [`meta/research-log/`](meta/research-log/) — raw findings from each research pass

## Validating the reading list

Link rot is the failure mode of any curriculum. Every URL cited here is in
`sources.tsv` and checkable:

```sh
harness-engineering/bin/check-links.sh      # every source still resolves
harness-engineering/bin/check-coverage.sh   # every cited URL is registered
```

The first reports HTTP status per source; the second fails if any chapter links
to a URL that isn't in `sources.tsv`, so a citation can't escape the checker. A `403` is usually an egress policy or a bot
filter rather than a dead link — `SOURCES.md` marks which sources are known to
reject automated fetchers and how they were verified instead.

## A caveat worth stating up front

This field is roughly two years old and its vocabulary is not settled. "Harness",
"scaffold", "agent", and "workflow" are used for overlapping and sometimes
contradictory things across the sources here. Chapter 1 and the glossary fix a
vocabulary for this curriculum; expect the sources to deviate from it, and read
the deviation as information about the author's priorities rather than as an error.
