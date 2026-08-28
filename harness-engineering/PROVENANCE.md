# Provenance

How this curriculum was built. Append-only: one section per research pass, each
recording what was searched, what was found, what changed, and what was rejected
and why. Raw findings live in [`meta/research-log/`](meta/research-log/).

The point of this file is that a curriculum is a set of claims about what is
worth reading, and those claims should be auditable. If a chapter recommends a
source, this file says how it was found and what was checked.

## Method

Each pass runs the same four steps:

1. **Search** — breadth-first web search across the pass's themes; record queries.
2. **Verify** — every candidate URL through `bin/check-links.sh`; anything cited
   in prose is fetched at least once so the annotation describes the real
   content, not the search snippet.
3. **Revise** — extend, correct, or *redact*. Redactions are logged with a reason;
   a source removed silently is indistinguishable from one never found.
4. **Log** — queries, findings, and diffs into `meta/research-log/pass-NN.md`.

## Standing rules

- **No unread citations.** A source in *Core reading* must have been fetched and
  read, not just returned by a search. *Going deeper* entries may be
  search-verified where the annotation makes no specific claim about content.
- **Prefer primary.** Vendor engineering blogs and specs over secondary
  summaries; the summary is cited only when it adds synthesis the primary lacks.
- **Mark the vendor.** Where a source is authored by a party selling the solution
  (Temporal, LangChain, Braintrust, Zylos), the annotation says so.
- **Annotate, don't summarize.** A reading list entry says why it is on the list
  and what to argue with. Length ≠ value.
- **Every URL in the TSV.** Prose links must appear in `sources.tsv` so the link
  checker sees them.

---

## Pass 01 — 2026-08-28 · initial build

**Scope.** Establish the folder, the ten-chapter structure, and a first complete
draft with a validated bibliography.

**Queries run** (16, in four batches):
long-horizon agent context engineering; agent harness design/loop architecture;
Anthropic workflows-vs-agents; 12-factor agents; durable execution & Temporal;
LangGraph control flow; context compaction & subagents; tool definition design;
Rust agent frameworks; TypeScript agent SDK & Zod; agent observability & OTel;
MCP security & sandboxing; "harness engineering" (OpenAI); LangChain "anatomy of
an agent harness"; Martin Fowler agentic/harness; ReAct paper. Plus two targeted
follow-ups: Claude Agent SDK TypeScript, `rmcp` Rust MCP SDK, Rust typestate,
Zod discriminated unions.

**Key discovery.** The field has consolidated around the term *harness
engineering* within roughly the last six months, with four independent
formulations that agree on substance and differ on emphasis:

| Source | Emphasis |
|---|---|
| OpenAI, *Harness Engineering* | Scaffolding as the locus of engineering discipline |
| Lilian Weng, *Harness Engineering for Self-Improvement* | Taxonomy + the self-improvement ladder |
| LangChain, *The Anatomy of an Agent Harness* | The six-primitive parts list |
| Fowler & Boeckeler | Cybernetic governors; deterministic guardrails |

Weng's definition was adopted as the curriculum's, because it enumerates the
components and therefore generates the chapter structure. LangChain's six
primitives were used as the cross-check that no major component lacked a chapter.

**Structural decisions.**
- *One folder, not two.* The request named both a `long horizon` folder and a
  `harness-engineering` folder. Resolved to a single `harness-engineering/` at the
  repo root — the more specific and later instruction — with long-horizon framing
  as the curriculum's organizing lens rather than a sibling directory. Two
  folders would have split one body of material across an arbitrary seam.
- *Ten chapters, not six.* The floor was six. Eight concept chapters emerged from
  the primitives list without forcing, and the requested Rust and TypeScript
  material earned two more as parallel implementation tracks rather than
  appendices — the language choice changes which failures are caught where,
  which is a design question, not a syntax question.
- *Annotated reading list, not prose textbook.* The best material on this subject
  is primary and public. Restating it would add a lossy layer; the chapters route,
  contextualize, and argue with the sources instead.
- *Every chapter ends in hands.* "Build this" and "Check yourself" in each. A
  curriculum you can finish without writing a loop teaches nothing durable.
- *Machine-checkable bibliography.* `sources.tsv` + `bin/check-links.sh`, so
  "validated" is a command that exits non-zero, not a claim in a README.

**Validation performed.**
- All 68 sources link-checked. Final result: **58 OK, 10 WARN** (403 from bot
  filters or this environment's egress policy), **0 FAIL**.
- `bin/check-coverage.sh` added and passing: every URL linked from chapter prose
  is registered in `sources.tsv`, so nothing can be cited without being checked.
  It caught one unregistered bare link on first run (see gap 2 below).
- One genuine dead link found and fixed: the CoSAI MCP security guide was cited
  from a search result at `…-model-context-protocol-security/`, which 404s. The
  live path is `…-mcp-security/`. The underlying whitepaper PDF was located and
  added as `S063`.
- Four `403` sources were separately confirmed to exist and their content read
  via a non-`curl` fetch path: `12-factor-agents` (all twelve factor names
  captured), `awesome-harness-engineering` (section structure captured),
  `lilianweng.github.io` harness post, and the LangChain harness anatomy post.
- `openai.com/index/harness-engineering/` returns 403 to every automated fetcher
  available here. It is retained, marked, and its claims in Ch.1 are stated only
  to the extent corroborated by multiple independent citing sources. **Open item
  for pass 02.**

**Rejected.**
- Several Medium reposts and SEO aggregator pages that restated Anthropic's
  engineering posts without adding synthesis. Cited the primary instead.
- Framework tutorials that teach an API rather than a design idea.
- `zylos.ai` ecosystem research is retained but marked as vendor research, with
  an instruction to read its methodology before its numbers.

**Known gaps, carried to pass 02.**
1. Corroborate or replace the OpenAI harness-engineering citation.
2. ~~Fowler's individual memo URLs unverified.~~ **Closed in this pass.**
   `check-coverage.sh` flagged a bare `martinfowler.com/` link in Ch.1; all five
   individual memos were then located, verified 200, cited directly, and
   registered as S064–S068.
3. Ch.9/Ch.10 reading is verified but several entries not yet read end to end —
   they are *Going deeper*, but should be promoted or dropped on evidence.
4. No source yet on **cost** as a first-class design constraint (budgeting,
   caching, model routing by step). Arguably a missing section in Ch.2 or Ch.7.
5. No source on **multi-day human/agent collaboration ergonomics** — the handoff
   problem when a person returns to a task an agent has been running.
6. The "lethal trifecta" is used in Ch.8 as established vocabulary but is not
   cited to its origin. Needs a source or a rewording.
7. Ch.3's core disagreement (graph frameworks vs. plain control flow) is
   presented fairly but only one side is argued in depth. A strong pro-framework
   piece would improve it.

---

## Pass 02 — 2026-08-28 · gap-driven revision and restructure

**Scope.** Work the eight open items from pass 01. Two of them turned out to be
big enough to restructure the curriculum around.

**Queries run** (8): lethal trifecta attribution; agent cost/token budget/prompt
caching/model routing; the pro-graph-framework argument; human–agent handoff and
asynchronous supervision; Anthropic long-running agents; OpenAI harness
engineering corroboration; "Don't Break the Cache" specifics; awesome-agentic-patterns.

**The pass-01 lesson held.** Mining an existing curated list's own citations beat
direct search again — `awesome-agentic-patterns` (97 patterns, 8 categories, each
required to be backed by a public reference and used by more than one team) is now
registered as a standing index to raid in future passes.

### Structural change: 10 chapters → 12

Two gaps had enough real literature behind them to be chapters rather than
sections, and both turned out to *contradict* existing chapters, which is the
strongest possible argument for giving them their own space:

- **New Ch.7, Cost, caching & economics.** Prompt caching is not an optimization
  applied at the end; it is a constraint on context layout. And it collides
  head-on with Ch.4: every context-engineering technique rewrites the context, and
  rewriting invalidates the cache. A chapter that says "compact aggressively"
  needs a chapter that says "and here is what that costs you."
- **New Ch.10, Long-running operations & the human interface.** The person
  supervising a nine-hour run is an engineering problem with its own failure modes
  (context anxiety, self-grading, the handoff), and the literature converges
  independently on the same three answers.

Renumbering: old 07→08, 08→09, 09→11, 10→12. Chapters 1–6 unchanged. All
cross-references, ranges, the README map, the glossary, and `sources.tsv`'s
chapter column were shifted programmatically and verified (no stale `Ch.7`/`Ch.10`
references remained before the new chapters took those slots).

The renumber was done now rather than later deliberately: the curriculum is two
passes old, every link is internal or regenerable, and the cost of this only ever
grows.

### The curriculum now contains a real disagreement, and says so

Three chapters give incompatible advice about context, and the README now tells
the reader to read all three before committing to a policy:

| Chapter | Position |
|---|---|
| Ch.4 (Anthropic, context engineering) | Compact, take notes, retrieve just in time |
| Ch.7 (Don't Break the Cache) | Every one of those rewrites invalidates your cache |
| Ch.10 (Anthropic, long-running apps) | For genuinely long tasks, **reset** the context instead of compacting |

Note that Ch.4 and Ch.10 are both Anthropic engineering posts. That is not an
error — they address different task lengths — but presenting them as a single
consistent doctrine would have been dishonest, so the chapters cross-reference
each other and the tension is named.

A second genuine disagreement was surfaced in Ch.3/Ch.6: LangGraph argues durable
execution engines predate LLM agents and lack streaming, add inter-step latency,
and degrade with long histories; Temporal argues hand-rolled state machines rot.
Both are now cited, on both sides, with a check-yourself question that refuses to
resolve it for the reader.

### Gaps closed

1. **OpenAI harness-engineering citation.** ✅ Corroborated. The 403 persists for
   every automated fetcher, but the substance is confirmed by InfoQ's report
   (S069, 200) plus several independent summaries. Ch.1 now carries the piece's
   sharpest line — *"context engineering asks what the agent should see; harness
   engineering asks what the system should prevent, measure, and correct"* — and
   the note says exactly how it was corroborated. Found a second OpenAI post
   (*Unlocking the Codex harness*, S070) in the process.
3. **Cost as a design constraint.** ✅ Became Ch.7.
4. **Lethal trifecta attribution.** ✅ Simon Willison, June 2025 (S088), now core
   reading in Ch.9, with his blunt recommendation — avoid combining all three —
   and his argument for why filtering is not a defense.
6. **Pro-graph-framework argument.** ✅ *Building LangGraph* (S072) added as Ch.3
   core reading. It derives six required runtime features from three properties of
   agents, and concedes Horthy's point directly: *"the biggest competitor to any
   code framework is always no framework."* Ch.3 now presents a real argument
   between serious people rather than a strawman.
7. **Human/agent handoff ergonomics.** ✅ Became Ch.10.

### Tooling improvement

`bin/check-links.sh` produced a false `FAIL` on a host that intermittently exceeds
30s. Confirmed by hand (three consecutive 200s), then fixed properly: timeout
raised to 45s and one retry added on connection-level failures only. A validator
that cries wolf gets ignored, which would defeat the point of having one.

**Validation after this pass:** 88 sources — **77 OK, 11 WARN, 0 FAIL**;
`check-coverage.sh` passing.

### Known gaps, carried to pass 03

1. **Ch.11/Ch.12 depth.** Both language chapters are now the least-revised
   material. Several *Going deeper* entries remain `unchecked`. Promote or drop on
   evidence.
2. **Meta Context Engineering** — the 89.1% vs. 70.7% SWE-bench figure from pass
   01 still has no located primary. Find it or strike the note.
3. **An unsourced number seen this pass:** "chat-only recovery achieves 8–13%
   correctness vs. 100% for semantics-aware checkpoint/restore." It would be an
   excellent Ch.6 citation if real. Deliberately *not* used pending a primary.
4. **No worked reference implementation.** Every chapter says "build this" and the
   reader starts from nothing each time. A single skeleton harness the exercises
   accrete onto would make the sequence far more usable.
5. **Multi-agent communication protocols** (A2A and successors) — not covered at
   all. Possibly a Ch.3 section rather than a chapter.
6. **RL / training-time approaches to long-horizon competence** — deliberately out
   of scope so far (this is a harness curriculum), but the boundary should be
   stated explicitly somewhere rather than left implicit.
7. **No exit assessment.** The capstone in Ch.12 is good; there is no way for a
   reader to check their own answers to *Check yourself*.

---

## Pass 03 — 2026-08-28 · the reference harness, and two numbers finally sourced

**Scope.** Work the seven gaps from pass 02. The headline item was gap 4: every
chapter said "build this" and the reader started from nothing each time.

**Queries run** (4): A2A / agent interoperability protocols; semantics-aware
checkpoint-restore; Meta Context Engineering primary; plus a targeted fetch of the
Rust typestate source. Fewer queries than previous passes, because most of the
work this pass was building rather than searching.

### The reference harness (gap 4 — closed)

`reference-harness/` is a runnable skeleton the exercises attach to. Design
decisions and why:

- **Zero dependencies, no network, no API key.** Node 22.6+ runs TypeScript
  directly, so `node harness.ts` works immediately. A curriculum artifact that
  needs a paid API key before it does anything is one most readers never run.
- **Deterministic stub model.** Swapping in a real provider is one function. This
  makes the point that almost none of a harness is about the model, and it makes
  the Ch.4 and Ch.7 measurement exercises reproducible by holding the model
  constant.
- **Implements Ch.2 and Ch.6 only.** Everything else is a marked `SEAM(Ch.N)`.
  Those two are implemented because nothing else has anywhere to stand without a
  loop that terminates and a log that survives a crash.
- **`verify.sh` asserts 8 claims**, each corresponding to a chapter's claim. The
  curriculum now validates its *code* as well as its links.

**A bug it shipped, and why it stayed documented.** The first working version
passed a naive crash test and was still wrong. Crashing between `tool_requested`
and the effect left an orphaned intent; on resume the harness asked the model for
a fresh decision, and the interrupted call was silently dropped — nothing errored,
the log looked healthy, the run reported success with output missing. Fixed with a
`pending` field and completion-before-decision on resume, and `verify.sh` now
compares post-crash side effects against a clean run byte for byte.

The bug is documented prominently in the reference harness README and referenced
from Ch.6, because it is a better teaching artifact than the fix. It is exactly
the "append before the effect" subtlety Ch.6 raises, it was found by *running* the
thing rather than reasoning about it, and it demonstrates the Ch.8 point that a
crash test which only asks "did it resume" is verification theater.

This also honors the repository's standing rule (`AGENTS.md`): verify anything you
document, and run the commands before shipping them. The rule earned its keep.

### Both unsourced numbers, sourced (gaps 2 and 3 — closed)

Pass 02 recorded two figures seen in search snippets and deliberately declined to
cite either. Both now have primaries, and both were worth chasing:

- **Crab** (arXiv 2604.28138): recovery *correctness* on Terminal-Bench — 8–13%
  chat-only, 28–42% chat+filesystem, 100% semantics-aware. Promoted to **Ch.6 core
  reading**; the 8–13% row is the strongest single argument in the chapter, since
  "preserve the conversation" is what most harnesses mean by resumable.
- **Meta Context Engineering via Agentic Skill Evolution** (arXiv 2601.21557, Ye
  et al., ICML 2026). The pass-01 snippet's "89.1% vs 70.7%" is not the headline
  the paper leads with; its own claim is 5.6–53.8% relative improvement (mean
  16.9%) over agentic CE baselines. Cited in Ch.4 with **the paper's numbers, not
  the snippet's** — which is the reason for the standing rule about not citing
  from search results.

### Gaps also closed

- **5. Multi-agent communication protocols.** Added as a Ch.3 section rather than
  a chapter: A2A (v1.0, Linux Foundation, Agent Cards, async over HTTP/SSE), the
  four-protocol survey, and the governance-gaps paper — with an explicit note that
  this is a premature abstraction for most systems, since a function call is a
  better edge than a protocol when one team owns every node.
- **6. Scope boundary.** The README now states plainly what is excluded: anything
  that changes the weights. Where a source crosses the line, the chapter says so.
- **1. Ch.11/Ch.12 depth (partial).** Ch.12's typestate section deepened from a
  full read of the primary: transitions consume `self`, `PhantomData` for markers,
  and the honest downsides — boilerplate per state, and awkwardness in loops,
  which is exactly what an agent loop does every iteration.

Also added: the field's broadest academic survey (arXiv 2606.20683), which did not
surface in two prior passes of direct searching and turned up incidentally.

**Validation after this pass:** 95 sources — **84 OK, 11 WARN, 0 FAIL**;
`check-coverage.sh` passing; `reference-harness/verify.sh` 8/8.

### Known gaps, carried to pass 04

1. **Ch.11 is now the least-revised chapter.** Ch.12 was deepened this pass; the
   TypeScript track was not, and the reference harness is *written* in TypeScript,
   which makes the gap more visible. Several `unchecked` entries remain there.
2. **No exit assessment.** Still no way for a reader to check their answers to
   *Check yourself*. The strongest version is probably not an answer key but a
   short list of "you understand this chapter if you can do X to the reference
   harness."
3. **The seams are asserted, not demonstrated.** `SEAM(Ch.4)` marks where a
   context policy goes, but no chapter shows a worked attachment. One fully worked
   seam — probably Ch.4's, since it is the most measured exercise — would show the
   pattern for the rest.
4. **Ch.5 has no exercise against the reference harness**, despite tool design
   being the most eval-driven part of the curriculum.
5. **No coverage of evaluation harnesses as products** (Terminal-Bench,
   SWE-bench harness design) — relevant to Ch.8 and now cited only incidentally
   through Crab.

---

## Pass 04 — 2026-08-28 · the worked seam, the exit assessment, and a renumber bug

**Scope.** Pass 03's five gaps. The two structural ones — an undemonstrated seam
and a missing exit assessment — both got built.

**Queries run** (2): Terminal-Bench / SWE-bench harness design; Claude Agent SDK
TypeScript hooks and permissions. A build pass again, not a search pass.

### Scheduling note

This pass was invoked by a fresh `/loop 30m …`, which under the skill's rules
means "create a cron." **I did not**, because the durable Routine created after
the last session restart already fires this cadence, and adding a `CronCreate` job
would have produced two schedulers at 30m — the exact duplication avoided in pass
02, with the ephemeral mechanism that already failed once. Verified the Routine
was live via `list_triggers`, then ran the pass directly.

### The worked seam (gap 3 — closed)

`SEAM(Ch.4)` is no longer a comment. The reference harness now implements a real
context policy: `buildContext()` derives what the model sees from the raw
transcript, with a written **retention contract**, compaction at 70% occupancy,
tool clearing, notes injection, and a per-category occupancy report.

Three policies via `POLICY=none|compact|full`, so Ch.4's central exercise is three
commands rather than a project.

**The measurement produced a result I did not expect, and it is now the most
valuable thing in the chapter.** On the same 20-step task:

| Policy | Occupancy | Compactions | Tokens billed |
|---|---|---|---|
| none | **105%** — overflows | 0 | 4,727 |
| compact | 70% | 2 | 3,943 |
| full | 69% | **0** | **3,570** |

**Tool clearing alone matched compaction's occupancy, billed 9% less, and never
compacted at all.** The per-category breakdown shows the mechanism: after two
compactions the retained contract had grown to 169 tokens against 36 tokens of
surviving history. Compaction *moved* the cost rather than removing it — the
contract is by definition what you promised to keep, so it accumulates. Ch.7
compounds it: each compaction rewrites the prefix, so a real provider would have
invalidated the cache twice to buy what eviction got for free.

This is now stated in Ch.4 as **reach for eviction before summarization, and
measure rather than assume**, with the caveat that another workload may invert it.
It came from running the thing, not from any source in the bibliography.

Getting there required tuning: the first working version never triggered
compaction at all (4% occupancy), so the most important technique in the chapter
was silently untested. A demo that cannot reach its own threshold demonstrates
nothing. Window dropped to 400 tokens and the step budget raised to 20.

Six new `verify.sh` assertions cover it, including that every compaction preserved
the `GOAL` contract item. **15/15.**

### The exit assessment (gap 2 — closed)

`ASSESSMENT.md`: one objective task per chapter, against the reference harness,
each with a pass condition you can check. Deliberately *not* an answer key for the
*Check yourself* questions — most have several defensible answers and a key would
turn a thinking exercise into recall.

Two design choices worth recording. Ch.6's task ("find a crash point that still
breaks it") accepts *either* a reproducible divergence or a written argument that
none remains — the second being harder. And the overall exit condition is Ch.8's:
change the harness and prove what the change did, **including at least one change
that made things worse and which you kept in the log**.

### A renumber bug from pass 02, found now (unlogged gap)

`check-refs.sh`, added this pass, passed clean — and was not what found the bug.
Three chapter references were **wrong but in range**, stranded by pass 02's
renumber:

```
Ch.1  "revise it after Chapters 4, 6, and 7."      → 8
Ch.11 "a better summary of Chapters 5, 6, and 8"   → 9
Ch.12 "highest-leverage work in Chapters 4, 5, 7"  → 8
```

The pass-02 regex matched `Chapter(s) N` and shifted the number *directly after*
the word. In a list — "Chapters 5, 6, and 8" — only the first number is adjacent,
so the tail silently kept pointing at the old numbering. Every reference still
resolved to a real chapter, so nothing was detectably broken; they just pointed at
the wrong one for two passes.

Found by grepping list-style patterns by hand while a *different* edit failed its
assertion — i.e. by accident. `check-refs.sh` now guards the case it can guard
(references outside the chapter range, and chapters missing from the README) and
its header states plainly that **it cannot catch an in-range-but-wrong reference,
which is exactly what a renumber produces.** A validator that overstates its
coverage is worse than none.

### Gaps also closed

- **1. Ch.11 depth.** Deepened from the SDK reference: the six permission modes as
  a *blast-radius dial rather than a security boundary*; the hook surface mapped
  to chapters (`PreToolUse` → approval, `PostToolUseFailure` → error compaction,
  `PreCompact` → retention contract); and `compact_boundary`/`pre_tokens` plus
  `SessionStart.source` as Ch.4 and Ch.6 surfaced in an API.
- **4. Ch.5 exercise.** Now measurable against the harness: three tools cost 58
  tokens of a 400-token window — **14.5% spent before any work happens.**
- **5. Eval harnesses as products.** Ch.8 gained Terminal-Bench and the SWE-bench
  harness, read as design artifacts. The task shape (instruction + sandboxed
  workspace + **executable test script** + reference solution) is what hobby evals
  omit, and the ~60% task rejection rate is a useful expectation-setter.

Also: **Harness-Bench** (arXiv 2605.27922) is now Ch.1 core reading. It holds the
model fixed and varies the harness across 106 tasks and 5,194 trajectories,
concluding that capability should be reported at the model–harness configuration
level rather than attributed to the base model. That converts this curriculum's
opening premise from a plausible story into a measured effect — which after four
passes is the single most useful citation found.

**Validation:** 100 sources — **89 OK, 11 WARN, 0 FAIL**; `check-coverage.sh` and
`check-refs.sh` passing; `verify.sh` **15/15**.

One honest note: a link-check run mid-pass reported a single transient `FAIL` that
cleared on re-run. The 45s-plus-one-retry hardening from pass 02 reduces this but
does not eliminate it; a genuinely slow host can still exceed it. Treat an
isolated `FAIL` as worth re-running before believing.

### Known gaps, carried to pass 05

1. **Ch.3 and Ch.9 have no worked seam.** Ch.4's is done and is the template;
   routing and permissions are the two most valuable remaining, and Ch.9's is the
   only one that would materially change the harness's safety posture.
2. **`verify.sh` is a bash script asserting on grepped stdout.** It is honest but
   brittle, and Ch.8's own assessment task asks the reader to replace it with
   structured output and a committed baseline. The curriculum should arguably ship
   what it asks for.
3. **No source read end-to-end for Ch.7's vendor claims.** The routing and caching
   magnitudes come from vendor posts, flagged as such but not independently
   corroborated the way the OpenAI citation eventually was.
4. **The reading-time estimates have never been validated** against anyone
   actually reading. They are plausible and entirely unverified — which, by this
   curriculum's own standards, means they should either be checked or marked.
5. **Nothing has been read by a human yet.** Four passes of self-review converge
   on self-consistency, not usefulness. The highest-value next input is a reader.
