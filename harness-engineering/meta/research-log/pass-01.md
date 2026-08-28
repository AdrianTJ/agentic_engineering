# Research log — pass 01 (2026-08-28)

Raw findings from the first pass. Kept verbatim-ish so later passes can see what
was known when a decision was made, and so a claim in a chapter can be traced
back to what was actually returned.

## Queries

**Batch 1 — the shape of the field**
1. `long-horizon agent tasks context engineering best practices 2026`
2. `agent harness design agentic loop architecture blog post`
3. `building effective agents Anthropic workflows vs agents patterns`
4. `12-factor agents principles Dex Horthy`

**Batch 2 — control flow, state, context, tools**
5. `durable execution workflow engine Temporal agents state machine checkpointing`
6. `LangGraph graph control flow agent state machine design docs`
7. `context compaction agent memory subagent Claude Code engineering blog`
8. `writing tools for AI agents tool definition design Anthropic engineering`

**Batch 3 — implementation, verification, security**
9. `Rust agent framework rig async tokio building LLM agent harness`
10. `TypeScript agent SDK Vercel AI SDK tool calling zod schema harness`
11. `agent evaluation observability tracing OpenTelemetry LLM agent production`
12. `Model Context Protocol specification architecture sandboxing agent permissions`

**Batch 4 — chasing the canon (triggered by batch 2's findings)**
13. `"harness engineering" OpenAI scaffolding discipline blog`
14. `LangChain "anatomy of an agent harness" filesystem sandbox memory primitives`
15. `Martin Fowler agentic engineering harness LLM patterns`
16. `ReAct reasoning acting language models paper Yao arxiv`

**Batch 5 — language-track specifics**
17. `Claude Agent SDK TypeScript documentation building agents custom tools`
18. `Rust MCP SDK rmcp official model context protocol rust crate`
19. `Rust typestate pattern state machine compile time guarantees builder`
20. `TypeScript zod schema JSON schema tool validation discriminated union effect-ts agent`

Batch 4 was the highest-yield of the five, and it only existed because
`awesome-harness-engineering`'s section listing named three anchor texts the
direct searches had missed. **Lesson for later passes: mine the awesome-lists'
own citations before searching again.**

## Findings worth preserving

### Definitions captured verbatim

Weng: *"the system surrounding a base model that orchestrates execution and
decides how the model thinks and plans, calls tools and acts, perceives and
manages context, stores artifacts, and evaluates results."*

OpenAI (via corroborating summaries): harness engineering is *"deciding when the
agent should stop, how errors get handled, and what guardrails keep it on track"*;
and *"the discipline shows up more in the scaffolding rather than the code."*

Fowler/Boeckeler: harnesses as *"cybernetic governors for AI agents"* — feedforward
guides and feedback sensors forming control loops. Three components: a
continuously refined knowledge base in the codebase; guardrails via both LLM
agents and deterministic linters/structural tests (ArchUnit); periodic "garbage
collection" agents finding doc inconsistencies and architectural violations.

Anthropic on context: models have an *attention budget*; long contexts suffer
*context rot*; the discipline is *"finding the smallest set of high-signal tokens
that maximize the likelihood of your desired outcome."*

Anthropic on tools: tools are *"contracts between deterministic systems and
non-deterministic agents"* — a new software paradigm, not an API.

### Component lists (used to check chapter coverage)

LangChain's six harness primitives: filesystem, bash/code execution, sandboxes,
memory & search, context management, planning & verification loops.

`awesome-harness-engineering` sections: Foundations · Design Primitives ·
Reference Implementations · Security/Sandbox/Permissions · Evals & Verification ·
Templates · Related lists.

The twelve factors (captured in full, since the repo is egress-blocked here):
1 Natural language to tool calls · 2 Own your prompts · 3 Own your context window ·
4 Tools are just structured outputs · 5 Unify execution state and business state ·
6 Launch/Pause/Resume with simple APIs · 7 Contact humans with tool calls ·
8 Own your control flow · 9 Compact errors into context window ·
10 Small, focused agents · 11 Trigger from anywhere ·
12 Make your agent a stateless reducer.

LangChain's four-loop stack: agent loop · verification loop · event-driven loop ·
hill-climbing loop. Stated structural claim: the outer loops' return arrow
*"reaches inside and updates the agent loop directly."*

Anthropic's five workflow patterns: prompt chaining · routing · parallelization
(sectioning / voting) · orchestrator–workers · evaluator–optimizer.

### Concrete facts worth citing

- **Roots is not a security control.** MCP's Roots declares directory/URI
  boundaries but is coordination only; real isolation is OS-level. Appears in
  both the Wiz and CoSAI material. → Ch.5, Ch.8.
- **CoSAI whitepaper:** 12 threat categories, ~40 distinct threats. Its single
  unambiguous recommendation: *token exchange at every trust boundary; never pass
  through tokens received from upstream callers.* → Ch.8.
- **Zod object-root constraint.** Providers require `"type": "object"` at a tool
  schema's root; `z.union` / `z.discriminatedUnion` produce a non-object root and
  the call is rejected. Valid TypeScript, valid Zod, invalid tool — the type
  system cannot catch it. → Ch.9. Best single concrete gotcha found this pass.
- **Rust cold-start numbers** (`rmcp` ecosystem, vendor-reported): <5ms vs.
  300–800ms for Python; 5–15 MB binaries vs. 50–200 MB. Load-bearing only for
  per-task sandboxes and MCP servers. → Ch.10, marked as vendor-reported.
- **LangGraph reducers.** Concurrent node writes merge via annotated reducers;
  omitting them is the common silent bug. → Ch.3.
- **Rewind.** A checkpointer lets a graph crash, resume, *and rewind* to an
  earlier state. Underrated; the best debugging affordance found. → Ch.6.
- **Anthropic on multi-agent limits:** underperforms on tasks with tight
  interdependencies between subtasks; token multiplication is the cost. → Ch.3.
- **Isolated vs. forked subagents.** Isolated = own context, no shared memory
  with coordinator (the norm); forked = inherits parent conversation. Different
  failure modes. → Ch.4.

### Research-frontier items (not required reading)

- *Memory as Action* (arXiv 2510.12635) — retain/compress/discard as learned actions.
- *Less Context, Better Agents* (arXiv 2606.10209) — less context often wins.
- Meta Context Engineering — reported 89.1% vs. 70.7% on SWE-bench Verified for
  optimized vs. hand-engineered context assembly. **Not cited in any chapter:**
  the number surfaced only in a search snippet and the primary was not located.
  → open item.
- *Awesome-Long-Horizon-Agents* (RUC-NLPIR) — academic roadmap; memory-systems
  branch traces MemGPT / hierarchical storage / RAPTOR / Self-RAG.

## Link validation

Full run of `bin/check-links.sh`: **52 OK / 10 WARN / 0 FAIL** across 63 sources.

One real break found and fixed:

```
FAIL  S037  …/securing-the-ai-agent-revolution-a-practical-guide-to-model-context-protocol-security/  (404)
  → …/securing-the-ai-agent-revolution-a-practical-guide-to-mcp-security/   (403, bot filter — live)
  → added S063, the whitepaper PDF itself (200)
```

That the search result gave a URL that 404s is the argument for the link checker
existing at all.

WARN breakdown — none are dead:

| Cause | Sources |
|---|---|
| `github.com` blocked by this environment's egress policy | S009, S018, S023, S043, S051, S052 |
| Cloudflare / bot filter on the host | S005 (openai.com), S037 (cosai), S028 (medium), S061 (gitconnected) |
| Blocked to `curl`, content confirmed via WebFetch | S009, S043 (and S005 attempted, still 403) |
| Egress-blocked, existence corroborated by ≥2 citing sources | S018, S023, S044, S051, S052 |

## Decisions taken this pass

1. Adopt Weng's harness definition as the curriculum's; it generates the chapter list.
2. One root folder (`harness-engineering/`), long-horizon as lens not directory.
3. Ten chapters: eight concept + two implementation tracks.
4. Annotated reading list over prose textbook.
5. Bibliography is machine-checkable; "validated" means a script exits 0.
6. Mark vendor-authored sources inline wherever they argue for their own product.

## Open items → pass 02

Carried into `PROVENANCE.md` "Known gaps". Priority order:

1. **OpenAI harness-engineering citation** — 403 to every fetcher. Corroborate
   properly or downgrade the claims it supports in Ch.1.
2. **Fowler individual memo URLs** — named in prose, not verified, not in the TSV.
3. **Cost as a design constraint** — no source yet. Likely a Ch.2 or Ch.7 section.
4. **Lethal trifecta** — used as vocabulary in Ch.8 without a citation.
5. **Meta Context Engineering primary** — locate it or drop the claim entirely.
6. **Pro-graph-framework argument** for Ch.3's disagreement, argued as well as
   the 12-factor side currently is.
7. **Human/agent handoff ergonomics** — the returning-human problem. No source.
8. **Promote or drop** unread *Going deeper* entries in Ch.9/Ch.10.
