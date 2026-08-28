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
