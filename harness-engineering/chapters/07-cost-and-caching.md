# Chapter 7 — Cost, caching, and the economics of the loop

> **Core question:** The loop works. It costs $80 a run and takes nine minutes
> to first token. Which of the previous six chapters caused that, and which one
> has to give?

## The problem

Cost gets treated as an operational afterthought when it is actually a design
constraint, because the cheapest agent and the correct agent are shaped
differently, and you have to choose the shape up front.

The specific reason is prompt caching. Providers let you pay a discounted rate
for a prefix they have already processed, and the discount is large, measured
at 45–80% on API cost with 13–31% better time to first token across OpenAI,
Anthropic, and Google. A cache hit, however, requires a stable prefix. Anything
that mutates early in the context invalidates everything after it.

Now put that next to Chapter 4. Compaction rewrites the conversation. Tool
clearing removes results from the middle. Just-in-time retrieval injects fresh
content at varying positions. Every context-engineering technique in Chapter 4
is a potential cache invalidation, and the naive implementation of each one
destroys the very discount it was trying to earn. The same research finds,
worse still, that naive full-context caching can increase latency.

That tension between token thrift and cache stability is the content of this
chapter, and it is the most common reason a well-designed harness turns out to
be unaffordable in production.

## Core reading

**1. [Don't Break the Cache: An Evaluation of Prompt Caching for Long-Horizon Agentic Tasks](https://arxiv.org/abs/2601.06007)** · ~45 min
This is the empirical foundation, and the paper the chapter is built on. It
evaluates three caching strategies, namely full-context, system-prompt-only,
and excluding dynamic tool results, across three providers. Several findings
should change your design. Done well, caching yields a 45–80% cost reduction
and a 13–31% improvement in time to first token. Strategic cache-block control
beats naive full-context caching, which can paradoxically increase latency. The
concrete rules are to place dynamic content at the end of the system prompt, to
avoid dynamic function definitions, and to exclude dynamic tool results from
the cached region. And caching behavior differs meaningfully by provider, so
the strategy does not port.

Read the rule about dynamic function definitions against Chapter 5. A harness
that adds and removes tools per step is paying full price on every turn, which
means progressive disclosure of skills carries a cache cost that nobody
mentions.

**2. [Prompt Caching with Deep Agents](https://www.langchain.com/blog/deep-agents-prompt-caching)** — LangChain · ~20 min
The same problem inside a working harness. Read it for where the cache
breakpoints actually go in an agent whose context is being actively managed,
because this is the practical bridge between the paper and Chapter 4.

**3. [Agent-as-a-Router: Agentic Model Routing for Coding Tasks](https://arxiv.org/abs/2606.22902)** · ~35 min
This covers the second lever, which is that not every step needs your best
model. Tool selection, formatting, classification, and routing are cheap-model
work, while the hard reasoning steps are not. Read it for how routing decisions
get made and what they cost in quality. This is the measured version of the
story, where the vendor version reports the savings and omits the regressions.

**3b. [RouteLLM: Learning to Route LLMs with Preference Data](https://arxiv.org/abs/2406.18665)** — Ong et al. / LMSYS · ~35 min
Read this before trusting the vendor numbers below, because it is the
independent measurement of the routing claim with the quality axis reported
rather than omitted. It finds up to roughly 85% cost reduction while retaining
about 95% of GPT-4 performance on MT-Bench, with matrix-factorization routers
hitting 95% of GPT-4 quality on 26% GPT-4 calls. The
[LMSYS write-up](https://www.lmsys.org/blog/2024-07-01-routellm/) is the
readable version.

Take two things from it. First, savings depend heavily on query distribution;
the published ranges span roughly 40–98%, so any single headline number is a
claim about someone else's traffic rather than yours. Second, routing is
evaluated on public benchmarks such as RouterBench and RouterEval, which means
you need your own eval before you route. Chapter 8's regression suite is a
prerequisite for this chapter's biggest lever rather than an optional
follow-up. The
[survey of dynamic routing and cascading](https://arxiv.org/abs/2603.04445)
maps the wider space.

**4. [AI Agent Cost Optimization: cutting LLM spend with routing](https://www.requesty.ai/blog/ai-agent-cost-optimization-how-to-cut-llm-spend-by-80-percent-with-routing)** — Requesty · ~20 min
This one is vendor-authored by a company that sells routing, so discount the
totals, and notice that its 60–80% routing figure sits inside RouteLLM's
measured range while omitting the quality cost that paper reports. Read it
anyway for the practitioner's stack of levers and their rough magnitudes:
routing at 60–80%, caching at 40–90% of input tokens, context optimization at
30–60%, and hard and soft budget limits. The last lever is the least glamorous
and the one that actually saves you. A soft alert at 50% and 80% of budget plus
a hard stop at 100% is what stands between a looping bug and a five-figure
invoice.

**5. [Prompt Caching Economics: cache-first agent design](https://www.digitalapplied.com/blog/prompt-caching-economics-cache-first-agent-architecture-2026)** · ~25 min
The synthesis. Treat the cache as a first-class architectural constraint rather
than an optimization applied at the end. If you accept that framing, your
context layout is decided by cache boundaries before it is decided by anything
else, and the result is a genuinely different design than Chapter 4 alone would
produce.

## Going deeper

- **[AI Agent Token Cost Optimization](https://fast.io/resources/ai-agent-token-cost-optimization/)** is a broader catalogue of levers, vendor-adjacent, and useful as a checklist.
- **[How LLM agent loops break caching](https://www.tensormesh.ai/blog-posts/agentic-ai-inference-cost-kv-caching-production)** gives the KV-cache view from the serving side. It matters most if you self-host, and it clarifies why prefix stability matters even if you do not.
- **[Self-Compacting Language Model Agents](https://arxiv.org/abs/2606.23525)** treats compaction as a learned behavior. Read it against Chapter 4's fixed-policy compaction and this chapter's cache cost.

## Key concepts

**Prompt cache.** A discounted rate for a prefix the provider has already
processed. It requires an exact, stable prefix.

**Cache breakpoint.** The boundary between the cached prefix and the volatile
remainder. Choosing where it goes is the central design decision of this
chapter.

**Prefix stability.** The property every cache depends on, and the one that
every Chapter 4 technique threatens.

**The compaction and cache tension.** Compaction saves tokens now and forfeits
the discount on everything after it. Sometimes correct, never free, and rarely
measured.

**Cache-first layout.** Static system prompt and tool definitions first,
dynamic content last. The layout falls out of the cache rather than the other
way around.

**Dynamic tool definitions.** Tools that change per step defeat caching, which
is the hidden cost of Chapter 5's progressive disclosure.

**Model routing.** A cheap model for cheap steps. The largest single lever, and
the one with real quality risk.

**Soft and hard token budgets.** Alert thresholds and a hard stop. This is
Chapter 2's budget stopping condition, denominated in money.

**Cost per successful task.** The only metric that matters, since cost per
token rewards an agent that fails cheaply.

**The volatile tail.** The portion of context that changes between turns, and
is therefore re-billed at full price. Billed cost tracks its size rather than
the total context size, and this is the single most useful reframing in the
chapter.

**Raw versus billed.** Two different rankings of the same policies. Advice
derived from raw tokens can invert under billing, and usually nobody checks.

**TTFT versus total cost.** Different optimizations, and occasionally opposed
ones. Naive full-context caching can improve one while hurting the other.

## Build this

Instrument, then optimize, then measure the thing you broke.

1. Account. Extend Chapter 8's traces with cost per span, covering input
   tokens, cached input tokens, output tokens, and dollars. Report cost per run
   and cost per successful run separately, because the gap between them is your
   real efficiency.
2. Baseline the cache. Log your cache hit rate per turn. Most unoptimized
   agents sit near zero, and nobody has ever looked.
3. Re-layout. Move the static content, meaning the system prompt and tool
   definitions, to the front, and all dynamic content to the end. Re-measure
   the hit rate and time to first token.
4. Measure the collision. Take the Chapter 4 experiment and re-run it with cost
   instrumentation. Compaction saved tokens, so what did it do to the cache hit
   rate, and was the net effect positive? This is the single most valuable
   measurement in the chapter, and almost nobody has made it.

   [`reference-harness/`](../reference-harness/) has made it, and the answer
   reversed Chapter 4's standing advice. Tool clearing uses 4% fewer raw tokens
   and costs 15% more billed, because compaction shrinks the volatile tail
   while clearing churns a mid-sized one. Billed cost tracks the size of the
   part that changes, not the size of the context.

   That first result used a block-granular cache model, and real providers
   cache at token-prefix granularity, so the curriculum measured it a second
   way with `CACHE_MODEL=chunk`, a 40-character-chunk prefix that sits much
   closer to the truth. The answer is more interesting than either "it holds"
   or "it flips":

   | Policy | block: billed | chunk: billed |
   |---|---|---|
   | none | 3,586 | **1,106** |
   | compact | 2,080 | **1,063** |
   | clear | 2,384 | 1,469 |
   | reset | 2,578 | 1,883 |

   The ordering survives, and the magnitude collapses. Under the coarse model,
   doing nothing costs 3.4 times what compaction costs. Under the finer one it
   costs 1.04 times as much, because an append-only context caches almost
   perfectly, and every technique that mutates the context forfeits that.

   This forces a conclusion the chapter did not expect: on cost alone, context
   engineering barely pays. It earns its keep on occupancy, since the no-policy
   run exceeds the window and is unusable at any price, and on coherence, which
   a scripted model cannot exhibit. If you justify a context policy on token
   cost, measure it at realistic cache granularity first, because you may be
   buying something you already had.

   One question remains open, and it is now the sharper one. A real tokenizer
   places boundaries where a fixed-width chunker does not. Redo the comparison
   against actual provider cache telemetry and see whether the 1.04 figure
   holds.
5. Route. Send one clearly cheap step, such as tool selection or a
   classification, to a small model. Run your Chapter 8 regression suite, and
   report the cost delta alongside the pass-rate delta. Keep the change only if
   the second is flat.
6. Cap it. Add a hard dollar budget as a Chapter 2 stopping condition, and test
   it by pointing the agent at a task it cannot finish.

## Check yourself

1. Why does compaction threaten the prompt cache? Trace the mechanism from the rewrite to the invalidation.
2. Your system prompt ends with the current timestamp. What is the cache hit rate, and why?
3. Cost per token as against cost per successful task: describe an optimization that improves the first and worsens the second.
4. Naive full-context caching can increase latency. Give the mechanism.
5. You cut cost 70% with model routing and the pass rate fell from 82% to 79%. What do you need to know before deciding, and what would you measure next?
6. Progressive disclosure, from Chapter 5, loads tool definitions on demand. What does that cost at the cache, and how would you get most of the benefit without the cost?
7. Design the cache-first context layout for an agent with a 12,000-token system prompt, forty tools, a growing conversation, and per-step file reads. Say where the breakpoint goes and why.
