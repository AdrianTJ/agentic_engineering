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

---

## Pass 05 — 2026-08-28 · the security seam, structured evals, and honest time estimates

**Scope.** Pass 04's five gaps. Two builds, one corroboration, one measurement
that did not flatter the curriculum.

**Queries run** (3): LLM routing cost/quality measurement; agent permission and
blast-radius policy engines; CaMeL. All three were targeted at named gaps.

### The Ch.9 worked seam (gap 1 — closed)

`SEAM(Ch.9)` is now implemented, following CaMeL's structure: **the model
proposes, a deterministic engine outside it decides.** Per-tool blast radius
(`read`/`write`/`external`), a taint bit set when a tool reads untrusted content,
and a trifecta check that closes egress once tainted — decided without consulting
the model that read the untrusted text.

The code states plainly that this is CaMeL's *structure*, not its mechanism: one
taint bit rather than capabilities enforced in a custom interpreter. It
demonstrates the pattern without delivering the guarantees, and pretending
otherwise would be the exact failure Ch.8 calls verification theater.

`POLICY_OFF=1` runs the identical script and the data leaves, which is how
`verify.sh` proves the control is load-bearing rather than decorative. **A
security control that is never observed failing open has not been tested.**

### What building it taught: an approval is a budget, not a predicate

Two wrong designs before the right one, both discovered by running it:

1. **Approvals keyed by idempotency key** (`step:tool:args`): one human decision,
   three prompts — the agent retried at new steps and each retry read as a new
   action.
2. **Approvals keyed logically** (`tool:args`) as a boolean: one prompt, then
   **four sends off a single approval.** A boolean approval is a standing permit.

The resolution is that these are two ledgers answering different questions and
they must be keyed differently — idempotency by *occurrence*, approval by
*action* — and that an approval's value is a **use count**, almost always 1.
`verify.sh` asserts one grant authorises exactly one send, and that the next send
re-prompts.

None of the Ch.9 sources say this. It is the second time the reference harness has
taught the curriculum something rather than the other way round.

### Structured evals with a committed baseline (gap 2 — closed)

Ch.8's assessment task tells the reader to emit structured results and commit a
baseline instead of eyeballing printed lines. `verify.sh` was a bash script
grepping stdout. It now writes `results.json`, compares against a committed
`baseline.json`, and exits non-zero on regression. `--baseline` re-baselines
deliberately; `--json` emits machine-readable results.

**A bug found while testing it.** The first version recorded a *different
assertion name* on the pass and fail branches (`ok "X"` / `bad "Y"`), so a genuine
regression appeared in the diff as one assertion DISAPPEARING and another
arriving — indistinguishable from a rename. Assertion names are now stable
identities via a single `chk <name>` helper that consumes the preceding exit
status.

Verified by injecting a real regression (disabling the trifecta check): reports
`REGRESSED`, exits 1. Restored: exits 0. **23 assertions, up from 15.**

Also worth recording: my first test of the exit code read `tail`'s status through
a pipe rather than the script's, and appeared to show the gate failing open. The
gate was fine; the test was wrong. Testing a test is not optional.

### Vendor claims corroborated (gap 3 — closed)

Ch.7's routing and caching magnitudes came from vendor posts, flagged but
unverified. **RouteLLM** (arXiv 2406.18665, LMSYS) is now core reading *ahead of*
the vendor piece: ~85% cost reduction retaining ~95% of GPT-4 quality on MT-Bench,
matrix-factorization routers reaching 95% quality on 26% frontier calls, and a
published range across query distributions of roughly 40–98%.

Two things the vendor framing omits and the chapter now states: the quality axis,
and that any single headline figure describes someone else's traffic. Also added:
routing is evaluated on benchmarks, so **Ch.8's regression suite is a prerequisite
for Ch.7's biggest lever**, not an optional follow-up.

### The time estimates, measured (gap 4 — closed, unflatteringly)

Every core reading carries a `~N min` that had never been checked. Measured nine
of them against word counts at 200 wpm:

| Source | Estimated | Measured |
|---|---|---|
| Writing effective tools | 35 | 17 |
| Harness design for long-running apps | 40 | 27 |
| The lethal trifecta | 10 | 10 |
| The art of loop engineering | 20 | 29 |
| Anatomy of an agent harness | 20 | 34 |
| Building LangGraph | 30 | 43 |
| Harness engineering for self-improvement | 45 | 72 |

**Unreliable at the individual level** — one 2× high, several ~40% low, one exact,
no systematic bias to correct for. Two more could not be measured at all
(JavaScript-rendered pages). The README now says this plainly, with the table, and
tells the reader to use the numbers as relative weight rather than a schedule.

Leaving unvalidated numbers in place would have been the easy option; so would
quietly deleting them. Publishing the error is the one consistent with what this
curriculum tells its reader to do.

### Tooling

`check-links.sh` gained a `webfetch-only` category: a connection failure on a
source whose note records verification by another path is an environment
limitation, not a dead link — the same treatment bot-blocked hosts already got.
The Sophos article is live (confirmed by fetch, and it contributed the
credential-isolation and sealed-tool-endpoint patterns to Ch.9) but unreachable to
`curl` from here.

**Validation:** 109 sources — **97 OK, 12 WARN, 0 FAIL**; `check-coverage.sh` and
`check-refs.sh` passing; `verify.sh` **23/23** against baseline.

### Known gaps, carried to pass 06

1. **Ch.3 has no worked seam** — routing is the last of the three most valuable.
2. **Recalibrate all reading estimates** from measured lengths, and find a method
   for the JS-rendered pages. Currently honest but wrong.
3. **The trifecta taint bit is coarse.** It taints the whole run on any untrusted
   read, so a legitimate egress after any file read is blocked forever. Real
   systems need per-value taint — which is CaMeL's actual contribution and the
   thing the seam most obviously simplifies away.
4. **No source read end-to-end for Ch.10's vendor/practitioner claims** — the same
   audit Ch.7 just received.
5. **Still nothing read by a human.** Five passes of self-review converge on
   internal consistency. The binding constraint on quality is now a reader.

---

## Pass 06 — 2026-08-28 · per-value provenance, the routing seam, and correcting pass 05

**Scope.** Pass 05's four actionable gaps. One of them turned into a correction of
pass 05 itself.

**Queries run** (2): empirical long-horizon session/degradation measurement; plus
a targeted fetch of the Codex usage study. Mostly a build pass.

### Per-value provenance (gap 3 — closed)

Pass 05's trifecta check used a single run-wide taint bit, and I flagged it as
coarse. Working with it showed it was worse than coarse — it was **unusable**: one
`read_file` poisoned the whole run, so any legitimate egress afterwards was denied
forever with no path back. A control nobody can operate gets turned off.

Provenance is now labelled **per value**, and the policy asks *does this payload
derive from an untrusted value?* rather than *did we ever touch anything
untrusted?* `SCRIPT=benign` is the case the old design got wrong — read untrusted
content, send something unrelated — and it now proceeds to the approval gate.

That distinction is CaMeL's actual contribution rather than its silhouette, which
is what pass 05's version was.

**The limitation is now a test, not a caveat.** `derivesFromUntrusted()` is a
substring check over distinctive tokens and does not survive laundering: paraphrase
the file, send the paraphrase, and it goes through. `SCRIPT=launder` demonstrates
it, and `verify.sh` **asserts that the bypass works**. A control's known limits are
part of its specification; pinning them means anyone who later strengthens the
check must re-baseline deliberately rather than have the suite silently agree.

### The Ch.3 routing seam (gap 1 — closed)

The last of the three high-value seams. `route()` makes one edge static —
continuing a sequential scan, where the next file is arithmetic — and defers the
rest.

| | Model calls | Tokens |
|---|---|---|
| all dynamic | 20 | 3,935 |
| with the router | 1 | 92 |

Identical work (asserted: both runs touch the same files). **And the number is
not honest without its caveat**, which both the README and Ch.3 now carry: a
sequential scan is the most routable thing an agent does, and 97% is not what a
real workload gives you. Quoting it bare would be precisely the vendor-benchmark
move Ch.7 tells the reader to distrust. What transfers is the per-edge question,
not the multiple.

### Correcting pass 05's measurement (gap 2 — closed, by retraction)

Pass 05 measured the reading-time estimates, found no systematic bias, and
published a table concluding they were random noise.

**That measurement was wrong.** It counted whole-page text including navigation
and footer boilerplate, which inflates short posts far more than long ones and
manufactured the scatter. Re-measured against body text only (preferring
`<article>`/`<main>`, stripping script/style/nav/header/footer), the estimates are
**internally consistent at ~120 wpm** — a defensible careful-reading rate for
technical prose, against the ~200 wpm usually quoted for skimming.

They remain loose: implied rates span 68–162 wpm, so roughly ±35% on any single
figure. The README now carries the corrected table and says what happened.

The lesson is recorded there too, because it is the more useful output than the
numbers: **the first measurement was confidently wrong in a way that looked like
data.** Measuring the wrong thing carefully still gives a wrong answer, and a
table is not evidence of rigor.

### Ch.10 audited (gap 4 — closed)

Ch.10 rested on four practitioner accounts that agree with each other. Two
empirical sources now sit alongside them, and one **disagrees**:

- **[SlopCodeBench](https://arxiv.org/abs/2603.24755)** chains agent output across
  checkpoints and scores quality at each step. Across 11 models and 20 iterative
  problems, **no agent solved a problem end-to-end**, and degradation resumed at
  the same rate regardless of starting quality. That is the empirical floor under
  the chapter's "three walls": the practitioner sources tell you how to go
  further; this tells you that you will still stop, so the handoff is not an edge
  case.
- **[METR, Measuring AI Ability to Complete Long Tasks](https://arxiv.org/abs/2503.14499)**
  gives "long-horizon" a unit — task length in human time at a stated reliability.
  Six passes in and this had never surfaced, which is a real gap in my searching:
  it is the paper that makes the curriculum's central adjective measurable.
- The Codex usage study contributes one number worth having (**8+ hour task
  requests up ~10× in H1 2026**) and several worth discounting — its productivity
  multiples are token-output counts from the vendor's own staff, and Ch.10 says so.

**Validation:** 114 sources — **102 OK, 12 WARN, 0 FAIL**; `check-coverage.sh` and
`check-refs.sh` passing; `verify.sh` **29/29** against a re-baselined
`baseline.json` (23 → 29).

### Known gaps, carried to pass 07

1. **Ch.2, Ch.5, Ch.7, Ch.8, Ch.10 still have no worked seam.** The three most
   valuable are done (Ch.3, Ch.4, Ch.9). Ch.7's cache accounting is the most
   useful of the remainder, since Ch.4's measurement is currently blind to the
   cache cost it warns about.
2. **The harness has no sandbox.** Ch.9's assessment task asks the reader to
   containerize; the reference implementation does not, so the seam stops at
   authorization and never reaches containment.
3. **Ch.11's seam is a stub by construction** — the model provider is fake. That
   is deliberate and documented, but it means the TypeScript chapter has no
   runnable artifact of its own.
4. **`derivesFromUntrusted` is O(untrusted values × payload).** Fine at this
   scale, wrong at any real one. Worth noting in the code before someone copies it.
5. **Still nothing read by a human.** Unchanged and unchangeable from here.

---

## Pass 07 — 2026-08-28 · cache accounting, containment, and a second correction

**Scope.** Pass 06's four actionable gaps. The cache work overturned advice this
curriculum had been giving for three passes.

**Queries run** (0). Entirely a build pass — every gap was about the reference
harness rather than the reading.

### Cache accounting (gap 1 — closed), and what it overturned

Ch.4 said compact; Ch.7 said compaction breaks your cache; and the harness could
measure the first but not the second. The curriculum contained a tension it could
not price.

It can now. `cacheSplit()` computes the cached prefix by comparing per-block
fingerprints against the previous turn, and bills cached input at 0.1x. Ranking on
the same 20-step task, with `clear` added specifically to isolate tool clearing as
the only variable against `compact`:

| Policy | Compactions | Cache hit | Raw | **Billed** |
|---|---|---|---|---|
| none | 0 | 34% | 5,107 | 3,530 |
| compact | 3 | **59%** | 4,168 | **1,939** |
| clear | 1 | 44% | **3,935** | 2,358 |

**The ranking inverts.** Tool clearing uses 6% fewer raw tokens and costs 22%
more billed. Pass 04 measured only raw tokens and concluded "reach for eviction
before summarization"; Ch.4 carried that advice for three passes. It was not wrong
about its measurement — it was measuring the wrong quantity.

The mechanism generalizes and is now the chapter's takeaway: **billed cost tracks
the size of the part that changes, not the size of the context.** Compaction
shrinks the volatile tail hard; tool clearing keeps a mid-sized history and
mutates it every turn, so a moderate block is re-billed continuously.

**And I have not settled it.** The model is block-granular — any change
invalidates a whole block — while real providers cache at token-prefix
granularity, where an append-only history stays largely cached and a mid-list
deletion invalidates only from that point. A more realistic model might restore
pass 04's ranking. Both the README and Ch.7 say so and set re-deriving it as the
exercise. Replacing one over-confident conclusion with another would have been
the easier ending.

Isolating `clear` mattered methodologically: `full` differs from `compact` in two
ways, and the first version of this comparison would have drawn a clean conclusion
from a confounded experiment. On this script the confound turned out to be inert
(`clear` and `full` are identical, since the notes block never fires), but that
was luck, not design.

### Containment (gap 2 — closed)

Ch.9's seam stopped at authorization. `authorize()` decides what the agent may
*ask for*; it says nothing about what the process can *do*.

`escape_workspace` is classified as a plain `write` **on purpose**, so
authorization passes it, and it writes outside the workspace. `run-sandboxed.sh`
runs the identical harness under Node's permission model with `--allow-fs-write`
scoped to `.state/`, and the same call is denied by the runtime. Both are
asserted.

Stated honestly in the code and the docs: this is a **runtime** boundary, not an
OS one — stronger than a path check inside the tool (which the tool can decline to
perform), weaker than a container (which also bounds CPU, memory, network, and
syscalls). No container is used because this environment has a Docker client and
no daemon; claiming containerization would have been the exact failure Ch.8 calls
verification theater.

A detail worth keeping: the runtime denial surfaces as an ordinary tool failure,
gets error-compacted by Ch.2's loop, and trips no-progress detection. The layers
compose without knowing about each other, which is the argument for defence in
depth stated as behaviour rather than as advice.

### Also

`derivesFromUntrusted` now carries its complexity — O(untrusted values × result
length × payload length) — and an explicit "do not lift this into production"
(gap 4).

**Validation:** 114 sources — **102 OK, 12 WARN, 0 FAIL**; `check-coverage.sh` and
`check-refs.sh` passing; `verify.sh` **34/34** (29 → 34), re-baselined
deliberately.

### Known gaps, carried to pass 08

1. **Two open technical questions, both stated rather than resolved.** Whether
   token-granular caching restores pass 04's ranking (Ch.7), and whether the
   laundering bypass is fixable without an interpreter (Ch.9). Both are honest
   open questions; neither should stay open indefinitely.
2. **Ch.2, Ch.5, Ch.8, Ch.10 still have no worked seam.** Ch.10's — handoff
   artifact and context reset — is now the most valuable, since Ch.10 has the
   empirical backing (SlopCodeBench) and no runnable demonstration.
3. **`harness.ts` is ~500 lines and doing eight jobs.** It was a teaching artifact
   when it did two. Splitting it into modules would help readers and would also
   let each chapter point at a file.
4. **The curriculum has never been read end-to-end by anyone, including me.**
   Six passes of local edits; no full read-through for coherence. Cheap and
   overdue.
5. **Still no human reader.** Unchanged.

---

## Pass 08 — 2026-08-28 · the end-to-end read

**Scope.** The coherence pass. Eight passes of local edits and nobody had read the
whole thing in order, including me. Zero queries; zero new sources.

It found more than expected, and the most important finding was structural rather
than editorial.

### Every published number was stale

Not one figure the chapters quoted about the reference harness was current.

The cause is mundane and worth naming: passes 05 and 07 added tools
(`post_webhook`, `escape_workspace`) to demonstrate the security seams. Tool
definitions are part of the context, so the tools block grew, so **every token
count in four chapters changed** — silently, with every test still passing,
because no test knew the prose existed.

| Figure | Published | Actual |
|---|---|---|
| Ch.3 dynamic-run tokens | 3,935 | 4,265 |
| Ch.3 routed-run tokens | 92 | 110 |
| Ch.4 `compact` billed | 1,939 | 2,080 |
| Ch.4 `clear` billed | 2,358 | 2,384 |
| Ch.5 fixed tool cost | 58 tok / 14.5% | 95 tok / 23% |
| README assertion count | 8 | 34 |
| Ch.11 assertion count | 15 | 34 |

The qualitative findings all survive — `clear` still uses fewer raw tokens and
bills more; routing still cuts 20 model calls to 1. But a curriculum that
publishes wrong numbers while running a link checker has its priorities exactly
backwards, and this is the second consecutive pass where a measurement I was
confident in turned out to be wrong.

**The fix is structural, not editorial.** `reference-harness/measure.sh` generates
`MEASUREMENTS.md` — one source of truth for every quoted figure — and
`bin/check-numbers.sh` fails if any chapter has drifted from it. The
reference-harness README no longer restates the tables at all; it links.

That makes four validators, and each exists because something went wrong that it
would have caught:

| Checker | The failure that created it |
|---|---|
| `check-links.sh` | a search result gave a URL that 404s (pass 01) |
| `check-coverage.sh` | a bare link escaped the link checker (pass 03) |
| `check-refs.sh` | a renumber stranded three cross-references (pass 04) |
| `check-numbers.sh` | published figures went stale twice (passes 07, 08) |

### The assessment had rotted

Three of the twelve tasks — Ch.3, Ch.7, Ch.9 — asked the reader to build things
the harness has since implemented. They were descriptions of existing code
presented as exercises.

Rewritten to point past the artifact instead, and two now aim at questions this
curriculum has **not** answered: re-derive the cache comparison under
token-granular caching (Ch.7), and close the laundering bypass or prove it
unclosable (Ch.9). The assessment intro now says which chapters are implemented
and that a clean result on the open ones belongs upstream.

### The reading ladder was quoted from memory

"Weekend ≈6h" was, summed from the per-source estimates, 8.7h. "Two weeks ≈25h"
was ~28h before exercises. Now computed rather than recalled, with the ±35% caveat
carried through, and the honest note that nobody has done the full ~75h — author
included.

### Smaller things a read catches and a grep does not

- Ch.1 said "roughly a million lines" twice in one paragraph — a pass-02 patch
  spliced badly and nothing noticed for six passes.
- Ch.1 promised the harness inventory would be revised "after Chapters 4, 6, 8 and
  9"; only Ch.9 ever asked. Rather than soften the promise, Ch.4, Ch.6 and Ch.8
  now each close by updating it, so the inventory is a genuine through-line.
- Ch.1 claimed the curriculum is "one chapter per part" of LangChain's six
  primitives. It is twelve chapters. Now says so, and names cost and the human
  interface as the two the parts list omits.
- Ch.2 said the harness "implements exactly this chapter" — true when written,
  false since pass 03.
- The README's seam list still claimed only Ch.2 and Ch.6 were implemented; six
  chapters are.
- The three-chapter context tension was described in pass-02 terms, before Ch.7
  measured it and found compaction wins on billed cost.
- `check-refs.sh` and `check-numbers.sh` were missing from the README's validator
  list.
- "Core reading | 3–6 pieces" — Ch.9 has 8, Ch.10 has 7.

**Validation:** 114 sources — **102 OK, 12 WARN, 0 FAIL**; all four doc checkers
passing; `verify.sh` **34/34**.

### Known gaps, carried to pass 09

1. **The two open technical questions are now assessment tasks** (Ch.7 cache
   granularity, Ch.9 laundering). That is a better home than a gap list, but they
   remain unanswered by the curriculum itself.
2. **Ch.5, Ch.8, Ch.10 have no worked seam.** Ch.10's is the most valuable — it
   has the strongest empirical backing (SlopCodeBench) and no runnable artifact.
3. **`harness.ts` is ~700 lines doing ten jobs.** It was a teaching artifact at
   two. Splitting it into modules would let each chapter point at a file, and
   would make the "read the first 80 lines" advice in Ch.2 unnecessary.
4. ~~`measure.sh` is not run automatically.~~ **Closed within the pass.**
   `check-numbers.sh` now fails if `harness.ts` or `verify.sh` is newer than
   `MEASUREMENTS.md`, so it cannot validate prose against a stale generated file.
   Verified by touching the source and confirming exit 1 — and my first attempt to
   confirm that read `head`'s exit code through a pipe rather than the script's,
   which is **the same mistake I made testing the regression gate in pass 05.**
   Recorded because a repeated error is worth more than a novel one.
5. **Still no human reader.** Eight passes. This one found seven real defects in a
   single ordered read, which is the strongest evidence yet that the binding
   constraint is a reader rather than another pass.

---

## Pass 09 — 2026-08-28 · modularization, the Ch.10 seam, and an open question answered

**Scope.** Pass 08's gaps 2 and 3, plus one of the two questions the curriculum
had left standing. Committed in four increments rather than one, at the user's
request. Branch renamed to `feat/long-horizon-textbook`.

Zero queries. Third build-only pass in a row.

### Modularization (gap 3 — closed)

`harness.ts` had grown to 850 lines doing ten jobs. It is now the loop and its
wiring (~190 lines), with one module per concern under the chapter that teaches
it — so a chapter points at a file rather than a line range, and Ch.2's advice to
"read the first 80 lines" is unnecessary.

Done under the 34-assertion suite, and `MEASUREMENTS.md` regenerated
**byte-identical** afterwards. That is the only reason to believe an 850-line
refactor changed nothing, and it is the argument for having built the measurement
harness two passes ago.

### The Ch.10 seam (gap 2 — closed), and the bug it produced

`POLICY=reset` implements Ch.10's alternative to compaction: clear the window at
the occupancy threshold, continue from `HANDOFF.md` alone.

The first version had **no bound on the artifact**. It listed every completed
effect under *Done*, so it grew from 661 to 949 bytes across one run, resets fired
ten times in twenty steps, and the handoff became the thing filling the window.
`src/handoff.ts` contains the sentence "a handoff that accumulates is just a
transcript with extra steps" — written in the same commit as the code that did
exactly that.

Bounding *Done* to the last five halved the resets and cut billed cost from 3,104
to 2,578. The finding is the one that generalizes: **a context reset does not
escape the retention problem, it relocates it.** Compaction decides what to drop
inside an opaque summary; a handoff decides it in a file you can read. Auditable,
not free — and anyone presenting reset as the clean alternative to compaction has
not bounded their artifact yet.

Also recorded in both READMEs and the measurements: `reset` bills more than
compaction here, **but the harness's model is a deterministic script that cannot
suffer context anxiety**, which is the failure Ch.10 argues reset prevents. The
table captures reset's cost and none of its benefit. Saying so was more important
than the number.

### The cache-granularity question, answered

Pass 07 measured the context policies under a block-granular cache and flagged
that real providers cache at prefix granularity, so the result might not survive.
`CACHE_MODEL=chunk` now measures the cached prefix in 40-char chunks.

| Policy | block: billed | chunk: billed |
|---|---|---|
| none | 3,586 | **1,106** |
| compact | 2,080 | **1,063** |
| clear | 2,384 | 1,469 |
| reset | 2,578 | 1,883 |

**The ordering survives; the magnitude collapses.** Doing nothing costs 3.4×
compaction under the coarse model and **1.04×** under the finer one, because an
append-only context caches almost perfectly and every technique that *mutates* the
context forfeits that.

Which lands somewhere the curriculum did not intend and now says plainly: **on
cost alone, context engineering barely pays.** It earns its keep on occupancy —
the no-policy run exceeds the window and is unusable at any price — and on
coherence, which a scripted model cannot exhibit. Ch.7 now warns against
justifying a context policy on token cost without first measuring at realistic
granularity.

Three assertions pin it. The Ch.7 assessment task advances to the next question:
a 40-char chunker is not a tokenizer.

### A process failure worth recording

The third commit was **pushed with `check-numbers.sh` red.** Its staleness guard —
added last pass, for exactly this — correctly reported that `verify.sh` was newer
than `MEASUREMENTS.md`, and I committed anyway.

Only the assertion count was stale (39 → 42), so nothing published was wrong. But
the checker was red and the push went out regardless, which is precisely the
failure the guard exists to prevent. Fixed in the next commit and recorded here
rather than quietly amended: **a validator you ignore is worse than one you never
built, because it costs the same and buys nothing.**

The honest gap it exposes: nothing *enforces* the checkers before a commit. They
are run by discipline, and this pass demonstrates the reliability of that.

**Validation:** 114 sources — 102 OK, 12 WARN, 0 FAIL; all four doc checkers
passing; `verify.sh` **42/42** (34 → 42).

### Known gaps, carried to pass 10

1. **Nothing enforces the checkers.** A pre-commit hook running
   `check-numbers.sh`, `check-refs.sh`, `check-coverage.sh` and `verify.sh` would
   have caught this pass's own slip. The highest-value remaining item, and the
   only one demonstrated necessary by evidence rather than argument.
2. **Ch.5 and Ch.8 remain the only unworked seams.** Ch.8's is the more useful:
   the harness has 42 assertions and no trace export, so it cannot demonstrate the
   observability half of its own chapter.
3. **One open question left:** does the 1.04× survive a real tokenizer and real
   provider cache semantics (minimum block sizes, TTLs)?
4. **The old remote branch could not be deleted.** `git push --delete` and the
   refspec form are both refused by this environment's proxy. `feat/long-horizon-textbook`
   carries every commit; the stale ref needs removing from GitHub's UI.
5. **Still no human reader.** Nine passes.
