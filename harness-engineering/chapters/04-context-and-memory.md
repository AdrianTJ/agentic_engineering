# Chapter 4 — Context engineering & memory for long horizons

> **Core question:** The task is longer than the window. What survives, in what
> form, and who decides?

## The problem

This is the chapter that defines "long-horizon." A task that fits in one
context window is a prompt-engineering problem. A task that does not fit is a
context-engineering problem, and that is a different discipline altogether:
instead of writing the best instruction, you are running a budget across time.

Two facts make it hard. The first is that attention is finite and degrades
before the window does. Anthropic frames this as models having an attention
budget, and long contexts suffering context rot, in which retrieval accuracy
falls off well short of the advertised limit; the quadratic relationship
between tokens is the architectural reason. The second is that the things which
must survive a long task, meaning the decisions, the constraints, and the dead
ends already explored, are exactly the things that look least urgent when
something has to be dropped.

The discipline, stated as sharply as anyone has managed: find the smallest set
of high-signal tokens that maximizes the likelihood of the outcome you want.

Two warnings belong up front, because this chapter is the one most often
applied naively. Every technique below rewrites the context, and rewriting
invalidates the prompt cache, so compaction can save tokens while costing you
money; that story is Chapter 7's. And compaction is not the only answer. Teams
running genuinely long tasks often prefer a full context reset plus a
structured handoff artifact, trading a lossy continuous window for a clean
slate, which is Chapter 10's story. Read this chapter, then read those two,
then decide.

## Core reading

**1. [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)** — Anthropic · ~35 min
This is the canonical text. Its sections cover context engineering as against
prompt engineering, why the distinction matters, the anatomy of effective
context, retrieval and agentic search, and context engineering for long-horizon
tasks specifically. Four techniques should be describable from memory
afterward. Compaction summarizes a conversation approaching the limit and
reinitializes from the summary, keeping architectural decisions and constraints
while dropping redundant tool output; the design question is what the summary
is required to preserve. Structured note-taking has the agent write to external
files, such as a `NOTES.md` or a to-do list, that outlive the window, giving it
memory it can re-read rather than memory it must carry. Sub-agent architectures
send a specialist off to work in a clean window and return a condensed result,
so exploration does not pollute the lead agent's budget. Just-in-time retrieval
holds lightweight references and fetches content at runtime, keeping the file
path in context rather than the file.

**2. [Context engineering: memory, compaction, and tool clearing](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools)** — Claude Cookbook · ~30 min, runnable
This is the executable counterpart, and you should run it rather than skim it.
Pay particular attention to tool clearing, which drops stale tool results that
are no longer load-bearing. It is the technique most people never implement,
and it has the best ratio of tokens saved to risk taken.

**3. [Context management in agent harnesses: memory, files, and subagents](https://arize.com/blog/context-management-in-agent-harnesses/)** — Arize · ~25 min
A comparative piece on how shipping harnesses actually do this. The distinction
worth extracting is between subagents with isolated context, which share no
memory with their coordinator and are the common case, and forked subagents,
which inherit the parent conversation. The two fail differently. Isolated
subagents lose implicit context and waste time re-deriving it, while forked
subagents inherit the parent's context rot.

**4. [Context Engineering 101: How agents manage context](https://newsletter.victordibia.com/p/context-engineering-101-how-agents)** — Victor Dibia · ~25 min
A clean taxonomy of strategies, with Claude Code as the worked example. It is
good for consolidating after the first three, so read it as the synthesis
rather than the introduction.

**5. [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)** — the filesystem-memory sections · ~15 min re-read
Return to this for the design rule the chapter turns on, which is that durable
state belongs in files rather than in context windows. Context is a cache, and
the filesystem is the database. Once you hold that, most context problems
become file-layout problems, and file layout is ordinary engineering.

## Going deeper

- **[Memory as Action: Autonomous Context Curation for Long-Horizon Agentic Tasks](https://arxiv.org/abs/2510.12635)** is the research frontier: retain, compress, and discard treated as learned actions rather than a fixed policy. The interesting claim is that context curation is a decision the agent can be trained to make.
- **[Meta Context Engineering via Agentic Skill Evolution](https://arxiv.org/abs/2601.21557)**, by Ye et al. at ICML 2026, treats context assembly as an optimization problem rather than a craft. A meta-agent evolves the context-engineering skills while a base agent applies them, with a reported 5.6–53.8% relative improvement (mean 16.9%) over the strongest agentic baselines. Read it for the framing: everything else in this chapter is a hand-written heuristic, and this paper asks what happens when you stop hand-writing them.
- **[Awesome-Long-Horizon-Agents](https://github.com/RUC-NLPIR/Awesome-Long-Horizon-Agents)** is the academic roadmap. Its memory-systems branch, covering MemGPT and hierarchical storage, traces the lineage from RAG to context engineering.
- **[Shedding Heavy Memories: Context Compaction in Codex, Claude Code, and OpenCode](https://justin3go.com/en/posts/2026/04/09-context-compaction-in-codex-claude-code-and-opencode)** puts three real compaction implementations side by side, and is concrete where the others are conceptual.
- **[Less Context, Better Agents: Efficient Context Engineering for Long-Horizon Tool-Using LLM Agents](https://arxiv.org/abs/2606.10209)** offers evidence that less context often wins, against the intuition that more is safer.

## Key concepts

**Context engineering.** Curating what occupies the window at each step. What
distinguishes it from prompt engineering is that it is a policy over time
rather than a string.

**Attention budget and context rot.** Usable attention is smaller than the
window, and it degrades as the window fills.

**Compaction.** Lossy summarize-and-restart, defined by its retention contract,
which is what it promises never to drop.

**Structured note-taking.** Externalized memory that the agent writes and
re-reads.

**Just-in-time retrieval.** References now, content on demand.

**Tool clearing.** Evicting stale tool results from the window.

**Isolated versus forked subagents.** A clean window as against an inherited
one, with different failure modes on each side.

**Context as cache, filesystem as truth.** The load-bearing inversion of this
chapter.

**The retention contract.** The explicit list of things that must survive every
compaction: the goal, the constraints, the decisions made, and what has already
been tried and failed. Write it down, because it is a spec, and compaction
without one is amnesia.

## Build this

Extend the Chapter 2 loop with a context policy, and then measure it.

1. Add a token accountant that logs window occupancy per iteration, broken down
   into system prompt, tool definitions, conversation, and tool results.
2. Write a retention contract, meaning an explicit list of what compaction must
   preserve.
3. Implement compaction at 70 percent occupancy, honoring the contract.
4. Implement tool clearing, dropping tool results older than N steps unless the
   contract references them.
5. Add a `NOTES.md` that the agent must update at every milestone, and
   re-inject it after each compaction.

Now run the experiment. Run the same long task three times, with no policy,
with compaction only, and with compaction plus notes plus clearing, and log the
tokens and the outcome each time. This is the single most instructive exercise
in the curriculum, because the failure of the no-policy run is specific, and
having seen it once you will recognize it forever.

[`reference-harness/`](../reference-harness/) implements this chapter as a
worked seam, so the experiment is three commands:

```sh
POLICY=none    SCRIPT=long node harness.ts
POLICY=compact SCRIPT=long node harness.ts
POLICY=full    SCRIPT=long node harness.ts
```

The measured result is worth knowing before you run your own, and so is the
fact that the first version of this measurement gave the opposite answer.

Counting raw tokens only, tool clearing wins. It matches compaction's occupancy
while using fewer tokens and compacting less, and for three passes of this
curriculum's history that was the chapter's advice: reach for eviction before
summarization. Then the harness learned to bill the cache, in Chapter 7's
sense, and the ranking flipped:

| Policy | Compactions | Cache hit | Raw | **Billed** |
|---|---|---|---|---|
| none | 0 | 38% | 5,467 | 3,586 |
| compact | 5 | **59%** | 4,437 | **2,080** |
| clear (tool clearing only) | 3 | 49% | **4,265** | 2,384 |

Tool clearing uses 4 percent fewer raw tokens and costs 15 percent more once
cached input is discounted. The earlier advice was not wrong about its
measurement. It was measuring the wrong quantity.

The mechanism generalizes, and it is the thing to remember: billed cost tracks
the size of the part that changes, not the size of the context. Compaction
shrinks the volatile tail hard, so very little is re-billed at full price on
each turn. Tool clearing keeps a mid-sized history and mutates it every turn,
so a moderate block is re-billed continuously. A larger context with a stable
prefix beats a smaller one that churns.

Two caveats before you act on this. The table above uses a block-granular cache
model, and when the harness re-measured at finer granularity the ordering
survived while the margins collapsed; Chapter 7 has that result and what it
implies. And your workload may differ from a twenty-step sequential scan in
ways that matter. What survives both caveats is the instruction to measure
billed rather than raw, and to treat any advice in this chapter, including this
paragraph, as conditional on which quantity was counted.

Then go back to your Chapter 1 harness inventory and fill in the context
management row. If you wrote "none" there, you now know what that costs in
tokens.

## Check yourself

1. Why is a million-token window not a solution to long-horizon context? Give the mechanism rather than the slogan.
2. What must a compaction summary never drop? Write the retention contract for a multi-day refactor.
3. Isolated versus forked subagents: give a task suited to each, and name the failure mode of choosing wrong.
4. Just-in-time retrieval trades tokens for latency and tool calls. When is that trade bad?
5. Your agent re-reads the same 8,000-token file on six iterations. Name three fixes and rank them.
6. Context is a cache and the filesystem is the database. What does that imply about what should happen when the process dies mid-task? Chapter 6 takes this up.
7. Compaction is lossy by construction. How would you detect, after the fact and from a trace, that a compaction lost something load-bearing?
