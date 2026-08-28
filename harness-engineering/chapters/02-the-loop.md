# Chapter 2 — The loop

> **Core question:** What actually runs, how does it recover, and — the question
> almost nobody designs deliberately — when does it stop?

## The problem

Every agent is, at bottom, a `while` loop: call the model, get a tool call,
execute it, append the result, repeat. That loop is fifteen lines of code, which
is why people underestimate it. The fifteen lines contain every long-horizon
failure mode: the loop that never terminates, the loop that terminates one step
early and declares victory, the loop that retries a poisoned tool call forty
times, the loop whose error messages consume the context window they were meant
to inform.

OpenAI's definition of the discipline is precisely about this: harness engineering
is *"deciding when the agent should stop, how errors get handled, and what
guardrails keep it on track."* Stopping is listed first for a reason.

The second insight of this chapter is that there is never one loop. LangChain's
framing — a stack of four nested loops — is the cleanest statement of it, and it
maps onto the rest of the curriculum: the inner loop is this chapter, the
verification loop is Chapter 8, the event-driven loop is Chapter 6, and the
hill-climbing loop is where Chapter 8 feeds back into Chapter 1.

## Core reading

**1. [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)** — Yao et al., ICLR 2023 · ~40 min
The origin of the loop shape everything else assumes. Interleaving reasoning
traces with actions means the trace can induce, track and update a plan and
handle exceptions, while the actions ground it against an external source.
Read Sections 1–3 and the HotpotQA analysis; the point that matters is *why*
interleaving beats reason-then-act: it gives the loop a place to notice it was
wrong. Everything since is elaboration on this structure.

**2. [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering)** — LangChain · ~20 min
The four-loop stack, and the best argument that loops compose:
1. **Agent loop** — model calls tools until done.
2. **Verification loop** — a grader checks output against a rubric and feeds failures back.
3. **Event-driven loop** — webhooks and cron run agents continuously without a human present.
4. **Hill-climbing loop** — an analysis agent reads production traces and *changes the harness*.

The key structural claim is that the return arrow of the outer loops "reaches
inside and updates the agent loop directly." The framework-specific primitives it
names are incidental; the taxonomy is the content.

**3. [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)** — Dex Horthy / HumanLayer · ~60 min, read in pieces
Twelve principles, of which five are pure loop design and belong here:
- **#8 Own your control flow** — the loop is your code, not a framework's.
- **#9 Compact errors into the context window** — errors are context, and context is budget. A raw stack trace appended forty times is a self-inflicted denial of service.
- **#4 Tools are just structured outputs** — demystifies the tool call; see Ch.5.
- **#12 Make your agent a stateless reducer** — `(state, event) → state`. Pairs with #5 and #6; see Ch.6.
- **#10 Small, focused agents** — a short loop with a narrow job outperforms a long one with a broad job. This is the loop-level argument for the sub-agents of Ch.4.

Horthy's blunt observation is worth carrying: most shipping products called
"agents" are mostly deterministic code with LLM steps at a few key points — not
"here's a prompt, here's a bag of tools, loop until done."

**4. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** — Anthropic, the *augmented LLM* and *agents* sections · ~10 min re-read
You read this in Ch.1 for the workflow/agent line. Re-read the agent section
specifically for the stopping discussion: agents run until they hit a stopping
condition, and the honest treatment of what happens when the condition is
never met.

## Going deeper

- **[Agent Harness Architecture: Building a Coding Agent From Scratch](https://levelup.gitconnected.com/agent-harness-architecture-building-a-coding-agent-from-scratch-ad42a86a74e8)** — walks the loop end to end in code, including the headless-runtime separation (the loop must not be coupled to how a user watches it — this is what makes the event-driven loop possible at all).
- **[Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)**, the self-improvement sections — the hill-climbing loop taken seriously: cycles of failure analysis, *bounded* edits, and validation.
- **[Context engineering: memory, compaction, and tool clearing](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools)** — Claude Cookbook. Runnable. The loop-maintenance mechanics in executable form.

## Key concepts

- **Agent loop / ReAct loop** — think, act, observe, repeat.
- **Stopping condition** — the explicit predicate that ends the loop. Kinds: goal-satisfied, budget-exhausted (steps, tokens, wall-clock, money), no-progress-detected, human-halt. A production loop needs at least three of the four; most hobby loops have zero and rely on the model volunteering to stop.
- **Progress detection** — distinguishing "still working" from "thrashing." Repeated identical tool calls, oscillating edits, and a plateau in a verification score are the cheap signals.
- **Error compaction** — turning a failure into the *smallest* context that lets the next iteration do better. Never the raw dump, never nothing.
- **Retry policy** — which errors are retryable, with what backoff, how many times, and — the part everyone forgets — whether the retry is *idempotent* (Ch.6).
- **Loop stacking** — inner loop bounded and cheap; outer loops slower, expensive, and allowed to change the inner one.
- **Headless runtime** — the loop decoupled from any UI, so cron, a webhook, and a human terminal are all just callers.

## Build this

Write the loop yourself, in whatever language you'll use for Ch.11 or Ch.12. No
framework. Requirements:

1. Tool dispatch from the model's structured output.
2. **Four** stopping conditions: goal, step budget, token budget, and no-progress.
3. Error compaction: on tool failure, append a one-line summary plus the first N
   chars of the error — never the raw dump — and never the same error twice in a row.
4. A step log written to disk as JSONL, one line per iteration.

Then deliberately break it: give it a tool that always fails, and a task it cannot
complete. A loop you have not watched fail is a loop you do not understand. Keep
the JSONL — Chapter 8 turns it into a trace.

## Check yourself

1. Name four independent stopping conditions and the failure each one catches. Which one catches "the model declared success without doing the work"?
2. Why does interleaving reasoning with acting beat planning fully up front? What does the plan-first version lose specifically?
3. You append a 4,000-token stack trace on every failed tool call and the loop retries five times. Describe the failure, in tokens, and give two fixes.
4. Horthy says own your control flow. What concretely can you no longer do when the loop belongs to a framework?
5. Which of the four loops is missing from almost every demo, and what does its absence mean for a task that runs overnight?
6. A stateless reducer `(state, event) → state` — what does that buy you that an in-memory loop doesn't? (Answer fully in Ch.6; guess now.)
