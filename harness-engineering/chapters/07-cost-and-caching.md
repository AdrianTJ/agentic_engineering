# Chapter 7 — Cost, caching, and the economics of the loop

> **Core question:** The loop works. It costs $80 a run and takes nine minutes to
> first token. Which of the previous six chapters caused that, and which one has
> to give?

## The problem

Cost is treated as an operational afterthought and it is actually a design
constraint, because the cheapest agent and the correct agent are shaped
differently and you have to choose the shape up front.

The specific reason is **prompt caching**. Providers let you pay a discounted
rate for a prefix they have already processed, and the discount is large —
measured at 45–80% on API cost with 13–31% better time-to-first-token across
OpenAI, Anthropic, and Google. But a cache hit requires a **stable prefix**.
Anything that mutates early in the context invalidates everything after it.

Now put that next to Chapter 4. Compaction rewrites the conversation. Tool
clearing removes results from the middle. Just-in-time retrieval injects fresh
content at varying positions. **Every context-engineering technique in Chapter 4
is a potential cache invalidation**, and the naive implementation of each one
destroys the discount it was trying to earn. Worse, the same research finds that
naive full-context caching can *increase* latency.

That tension — token thrift versus cache stability — is the content of this
chapter, and it is the most common reason a well-designed harness is
unaffordable in production.

## Core reading

**1. [Don't Break the Cache: An Evaluation of Prompt Caching for Long-Horizon Agentic Tasks](https://arxiv.org/abs/2601.06007)** · ~45 min
The empirical foundation, and the paper this chapter is built on. Evaluates three
caching strategies — full-context, system-prompt-only, and excluding dynamic tool
results — across three providers. The findings that should change your design:
- 45–80% cost reduction, 13–31% TTFT improvement, when done right.
- **Strategic cache-block control beats naive full-context caching**, which can
  paradoxically increase latency.
- Concrete rules: place dynamic content at the *end* of the system prompt; avoid
  dynamic function definitions; exclude dynamic tool results from the cached region.
- Caching behavior differs meaningfully by provider — the strategy is not portable.

Read the third bullet against Chapter 5. "Avoid dynamic tool definitions" means a
harness that adds and removes tools per step is paying full price on every turn.
Progressive disclosure of skills has a cache cost that nobody mentions.

**2. [Prompt Caching with Deep Agents](https://www.langchain.com/blog/deep-agents-prompt-caching)** — LangChain · ~20 min
The same problem inside a working harness. Read it for where the cache breakpoints
actually go in an agent whose context is being actively managed — this is the
practical bridge between the paper and Chapter 4.

**3. [Agent-as-a-Router: Agentic Model Routing for Coding Tasks](https://arxiv.org/abs/2606.22902)** · ~35 min
The second lever: not every step needs your best model. Tool selection, formatting,
classification, and routing are cheap-model work; the hard reasoning steps are not.
Read for how routing decisions get made and what they cost in quality — the honest
version, rather than the vendor version, which always reports the savings and not
the regressions.

**4. [AI Agent Cost Optimization: cutting LLM spend with routing](https://www.requesty.ai/blog/ai-agent-cost-optimization-how-to-cut-llm-spend-by-80-percent-with-routing)** — Requesty · ~20 min
Vendor-authored — the company sells routing, so discount the totals. Read it
anyway for the practitioner's stack of levers and rough magnitudes: routing
(60–80%), caching (40–90% of input tokens), context optimization (30–60%), and
hard/soft budget limits. The last one is the least glamorous and the one that
actually saves you: a soft alert at 50% and 80% of budget and a hard stop at 100%
is what stands between a looping bug and a five-figure invoice.

**5. [Prompt Caching Economics: cache-first agent design](https://www.digitalapplied.com/blog/prompt-caching-economics-cache-first-agent-architecture-2026)** · ~25 min
The synthesis: treat the cache as a first-class architectural constraint rather
than an optimization applied at the end. If you accept the framing, your context
layout is decided by cache boundaries before it is decided by anything else —
which is a genuinely different design than Chapter 4 alone would produce.

## Going deeper

- **[AI Agent Token Cost Optimization](https://fast.io/resources/ai-agent-token-cost-optimization/)** — a broader catalogue of levers; vendor-adjacent, useful as a checklist.
- **[How LLM agent loops break caching](https://www.tensormesh.ai/blog-posts/agentic-ai-inference-cost-kv-caching-production)** — the KV-cache view from the serving side. Relevant if you self-host, and clarifying about *why* prefix stability matters even if you don't.
- **[Self-Compacting Language Model Agents](https://arxiv.org/abs/2606.23525)** — compaction as a learned behavior; read against Chapter 4's fixed-policy compaction and this chapter's cache cost.

## Key concepts

- **Prompt cache** — a discounted rate for a prefix the provider has already
  processed. Requires an exact, stable prefix.
- **Cache breakpoint** — the boundary between the cached prefix and the volatile
  remainder. Choosing where it goes is the central design decision of this chapter.
- **Prefix stability** — the property every cache depends on and every Chapter 4
  technique threatens.
- **The compaction/cache tension** — compaction saves tokens *now* and forfeits the
  discount on everything after it. Sometimes correct, never free, rarely measured.
- **Cache-first layout** — static system prompt and tool definitions first, dynamic
  content last. The layout falls out of the cache, not the other way around.
- **Dynamic tool definitions** — tools that change per step defeat caching. The
  hidden cost of progressive disclosure (Ch.5).
- **Model routing** — cheap model for cheap steps. The largest single lever, and
  the one with real quality risk.
- **Token budget: soft and hard** — alert thresholds and a hard stop. Chapter 2's
  budget stopping condition, denominated in money.
- **Cost per successful task** — the only metric that matters. Cost per token
  rewards an agent that fails cheaply.
- **TTFT vs. total cost** — different optimizations, occasionally opposed. Naive
  full-context caching can improve one while hurting the other.

## Build this

Instrument, then optimize, then measure the thing you broke.

1. **Account.** Extend Chapter 8's traces with cost per span: input tokens,
   **cached** input tokens, output tokens, and dollars. Report cost per run and
   **cost per successful run** separately — the gap between them is your real
   efficiency.
2. **Baseline the cache.** Log your cache hit rate per turn. Most unoptimized
   agents sit near zero and nobody has ever looked.
3. **Re-layout.** Move static content (system prompt, tool definitions) to the
   front and all dynamic content to the end. Re-measure hit rate and TTFT.
4. **Measure the collision.** Take the Chapter 4 experiment and re-run it with
   cost instrumentation. Compaction saved tokens; what did it do to the cache hit
   rate, and was the net positive? This is the single most valuable measurement in
   the chapter, and almost nobody has made it.
5. **Route.** Send one clearly-cheap step (tool selection, or a classification) to
   a small model. Run your Chapter 8 regression suite. Report cost delta *and*
   pass-rate delta. Keep the change only if the second is flat.
6. **Cap it.** Add a hard dollar budget as a Chapter 2 stopping condition. Test it
   by pointing the agent at a task it cannot finish.

## Check yourself

1. Why does compaction threaten the prompt cache? Trace the mechanism from the
   rewrite to the invalidation.
2. Your system prompt ends with the current timestamp. What is the cache hit rate,
   and why?
3. Cost per token vs. cost per successful task — describe an optimization that
   improves the first and worsens the second.
4. Naive full-context caching can *increase* latency. Give the mechanism.
5. You cut cost 70% with model routing and pass rate fell from 82% to 79%. What do
   you need to know before deciding, and what would you measure next?
6. Progressive disclosure (Ch.5) loads tool definitions on demand. What does that
   cost at the cache, and how would you get most of the benefit without the cost?
7. Design the cache-first context layout for an agent with a 12k-token system
   prompt, 40 tools, a growing conversation, and per-step file reads. Say where the
   breakpoint goes and why.
