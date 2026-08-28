# Chapter 4 — Context engineering & memory for long horizons

> **Core question:** The task is longer than the window. What survives, in what
> form, and who decides?

## The problem

This is the chapter that defines "long-horizon." A task that fits in one context
window is a prompt-engineering problem. A task that doesn't is a **context
engineering** problem, and it is a fundamentally different discipline: instead of
writing the best instruction, you are running a *budget* across time.

Two facts make it hard. First, attention is finite and degrades before the window
does — Anthropic's framing is that models have an *attention budget*, and long
contexts suffer **context rot**, where retrieval accuracy falls off well short of
the advertised limit. The n² relationship between tokens is the architectural
reason. Second, the things that must survive a long task — decisions, constraints,
dead ends already explored — are exactly the things that look least urgent when
something has to be dropped.

So the discipline, stated as sharply as anyone has: **find the smallest set of
high-signal tokens that maximizes the likelihood of the outcome you want.**

Two warnings before you commit to the techniques below, because this chapter is
the one most often applied naively:

- Every technique here **rewrites the context, and rewriting invalidates the
  prompt cache.** Compaction can save tokens and cost you more money. Ch.7.
- Compaction is not the only answer. Teams running genuinely long tasks often
  prefer a **full context reset plus a structured handoff artifact** — a clean
  slate over a lossy continuous one. Ch.10.

Read this chapter, then read those two, then decide.

## Core reading

**1. [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)** — Anthropic · ~35 min
The canonical text. Sections: context engineering vs. prompt engineering; why it
matters; the anatomy of effective context; retrieval and agentic search; **context
engineering for long-horizon tasks**. Four techniques you should be able to
describe from memory afterward:
- **Compaction** — summarize a conversation approaching the limit and reinitialize from the summary. Keep architectural decisions and constraints; drop redundant tool output. The design question is *what the summary is required to preserve*.
- **Structured note-taking** — the agent writes to external files (`NOTES.md`, a to-do list) that outlive the window. Memory the agent can *re-read*, not memory it must carry.
- **Sub-agent architectures** — a specialist works in a clean window and returns a condensed result, so exploration doesn't pollute the lead agent's budget.
- **Just-in-time retrieval** — hold lightweight references, fetch at runtime. The file path, not the file.

**2. [Context engineering: memory, compaction, and tool clearing](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools)** — Claude Cookbook · ~30 min, runnable
The executable counterpart. Run it. **Tool clearing** — dropping stale tool results
that are no longer load-bearing — is the technique most people never implement
and the one with the best ratio of tokens saved to risk taken.

**3. [Context management in agent harnesses: memory, files, and subagents](https://arize.com/blog/context-management-in-agent-harnesses/)** — Arize · ~25 min
Comparative: how different shipping harnesses actually do this. The distinction
worth extracting is between subagents with **isolated** context (no shared memory
with the coordinator — the common case) and **forked** subagents that inherit the
parent conversation. They fail differently: isolated subagents lose implicit
context and re-derive it; forked subagents inherit the parent's context rot.

**4. [Context Engineering 101: How agents manage context](https://newsletter.victordibia.com/p/context-engineering-101-how-agents)** — Victor Dibia · ~25 min
A clean taxonomy of strategies with Claude Code as the worked example. Good for
consolidating after the first three; read it as the synthesis, not the intro.

**5. [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)** — the filesystem-memory sections · ~15 min re-read
For the design rule this chapter turns on: **durable state belongs in files, not
in context windows.** Context is a cache. The filesystem is the database. Once you
hold that, most context problems become file-layout problems, which are ordinary
engineering.

## Going deeper

- **[Memory as Action: Autonomous Context Curation for Long-Horizon Agentic Tasks](https://arxiv.org/abs/2510.12635)** — the research frontier: treat retain/compress/discard as *learned actions* rather than a fixed policy. The interesting claim is that context curation is a decision the agent can be trained to make.
- **[Meta Context Engineering via Agentic Skill Evolution](https://arxiv.org/abs/2601.21557)** — Ye et al., ICML 2026. Treats context assembly as an optimization problem rather than a craft: a bi-level scheme where a meta-agent evolves the context-engineering *skills* while a base agent applies them. Reported 5.6–53.8% relative improvement (mean 16.9%) over state-of-the-art agentic CE methods. The reason to read it here is the framing — everything else in this chapter is a hand-written heuristic, and this asks what happens when you stop hand-writing them.
- **Awesome-Long-Horizon-Agents** ([RUC-NLPIR](https://github.com/RUC-NLPIR/Awesome-Long-Horizon-Agents)) — the academic roadmap; the memory-systems branch (MemGPT, hierarchical storage) traces the lineage from RAG to context engineering.
- **[Shedding Heavy Memories: Context Compaction in Codex, Claude Code, and OpenCode](https://justin3go.com/en/posts/2026/04/09-context-compaction-in-codex-claude-code-and-opencode)** — a side-by-side of three real compaction implementations. Concrete where the others are conceptual.
- **[Less Context, Better Agents: Efficient Context Engineering for Long-Horizon Tool-Using LLM Agents](https://arxiv.org/abs/2606.10209)** — evidence that *less* context often wins, against the intuition that more is safer.

## Key concepts

- **Context engineering** — curating what occupies the window at each step. Distinguished from prompt engineering by being a policy over time rather than a string.
- **Attention budget / context rot** — usable attention is smaller than the window, and degrades as it fills.
- **Compaction** — lossy summarize-and-restart. Defined by its *retention contract*: what it promises never to drop.
- **Structured note-taking** — externalized memory the agent writes and re-reads.
- **Just-in-time retrieval** — references now, content on demand.
- **Tool clearing** — evicting stale tool results.
- **Isolated vs. forked subagents** — clean window vs. inherited window; different failure modes.
- **Context as cache, filesystem as truth** — the load-bearing inversion.
- **The retention contract** — the explicit list of things that must survive every compaction (goal, constraints, decisions, what has already been tried and failed). Write it down; it is a spec, and compaction without one is amnesia.

## Build this

Extend the Ch.2 loop with a context policy, and *measure* it.

1. Add a token accountant: log window occupancy per iteration, broken down by
   system prompt / tool definitions / conversation / tool results.
2. Write a **retention contract** — an explicit list of what compaction must preserve.
3. Implement compaction at 70% occupancy, honoring the contract.
4. Implement tool clearing: drop tool results older than N steps unless referenced
   by the contract.
5. Add a `NOTES.md` the agent must update at every milestone, and re-inject it
   after each compaction.

Now the experiment: run the same long task three times — no policy, compaction
only, compaction + notes + clearing. Log tokens and outcome. This is the single
most instructive exercise in the curriculum, because the failure of the
no-policy run is *specific* and you will recognize it forever afterward.

[`reference-harness/`](../reference-harness/) implements this chapter as its
**worked seam**, so the experiment is three commands:

```sh
POLICY=none    SCRIPT=long node harness.ts
POLICY=compact SCRIPT=long node harness.ts
POLICY=full    SCRIPT=long node harness.ts
```

Its measured result is worth knowing before you run your own, because it is not
the one most people expect:

| Policy | Occupancy | Compactions | Tokens billed |
|---|---|---|---|
| none | **105%** — overflows | 0 | 4,727 |
| compact | 70% | 2 | 3,943 |
| full | 69% | **0** | **3,570** |

**Tool clearing alone matched compaction's occupancy, billed less, and never
compacted.** The per-category breakdown shows why: after two compactions the
retained contract had grown to 169 tokens against 36 tokens of surviving history.
Compaction moved the cost rather than removing it — the contract is precisely
what you promised not to drop, so it accumulates. And each compaction rewrote the
prefix, which Ch.7 will tell you costs you the cache twice over.

The lesson is not that compaction is wrong. It is **reach for eviction before
summarization**, and measure rather than assume. Your workload may invert this;
that is the point of running it.

## Check yourself

1. Why is a 1M-token window not a solution to long-horizon context? Give the mechanism, not the slogan.
2. What must a compaction summary *never* drop? Write the retention contract for a multi-day refactor.
3. Isolated vs. forked subagents: give a task suited to each, and name the failure mode of choosing wrong.
4. Just-in-time retrieval trades tokens for latency and tool calls. When is that trade bad?
5. Your agent re-reads the same 8,000-token file on six iterations. Name three fixes and rank them.
6. "Context is a cache; the filesystem is the database." What does that imply about what should happen when the process dies mid-task? (Ch.6.)
7. Compaction is lossy by construction. How would you *detect* that a compaction lost something load-bearing, after the fact, from a trace?
