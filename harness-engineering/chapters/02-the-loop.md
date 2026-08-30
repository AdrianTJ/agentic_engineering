# Chapter 2 — The loop

> **Core question:** What actually runs, how does it recover, and when does it
> stop? The last of those is the question almost nobody designs deliberately.

## The problem

Every agent is, at bottom, a `while` loop: call the model, get a tool call back,
execute it, append the result, and repeat. The whole thing fits in fifteen lines
of code, which is exactly why people underestimate it. Those fifteen lines
contain every long-horizon failure mode there is. The loop that never
terminates, the loop that stops one step early and declares victory, the loop
that retries a poisoned tool call forty times, and the loop whose error messages
consume the very context window they were meant to inform are all the same
fifteen lines, misjudged in different places.

OpenAI's definition of the discipline speaks to this directly. Harness
engineering, in their words, is *"deciding when the agent should stop, how
errors get handled, and what guardrails keep it on track."* Stopping is listed
first for a reason.

The second idea in this chapter is that there is never only one loop. LangChain
frames the full system as a stack of four nested loops, and the framing maps
cleanly onto the rest of the curriculum: the inner agent loop is this chapter,
the verification loop is Chapter 8, the event-driven loop is Chapter 6, and the
hill-climbing loop is where Chapter 8 feeds back into Chapter 1.

## Core reading

**1. [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)** — Yao et al., ICLR 2023 · ~40 min
This is the origin of the loop shape that everything since assumes. Interleaving
reasoning traces with actions means the trace can induce, track, and update a
plan while handling exceptions along the way, and the actions ground that trace
against an external source. Read Sections 1 through 3 and the HotpotQA
analysis. The point that matters is why interleaving beats reasoning first and
acting second: it gives the loop a place to notice that it was wrong. Most of
what has been published since is elaboration on this structure.

**2. [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering)** — LangChain · ~20 min
This piece supplies the four-loop stack, and with it the best argument that
loops compose. The agent loop calls tools until the work is done. The
verification loop puts a grader between the output and a rubric, and feeds
failures back in. The event-driven loop uses webhooks and cron to keep agents
running with no human present. The hill-climbing loop, finally, has an analysis
agent read production traces and change the harness itself. The key structural
claim is that the return arrow of the outer loops "reaches inside and updates
the agent loop directly." The framework-specific primitives the post names are
incidental; the taxonomy is the content.

**3. [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)** — Dex Horthy / HumanLayer · ~60 min, read in pieces
Of Horthy's twelve principles, five are pure loop design and belong to this
chapter. Factor 8, own your control flow, says the loop is your code rather
than a framework's. Factor 9, compact errors into the context window, follows
from the observation that errors are context and context is budget; a raw stack
trace appended forty times is a self-inflicted denial of service. Factor 4,
tools are just structured outputs, demystifies the tool call and comes back in
Chapter 5. Factor 12, make your agent a stateless reducer, is the
`(state, event) → state` idea that Chapter 6 builds on. And factor 10, small
focused agents, argues that a short loop with a narrow job outperforms a long
one with a broad job, which is the loop-level case for the sub-agents of
Chapter 4.

Horthy's blunt observation deserves carrying forward too. Most shipping
products that call themselves agents are mostly deterministic code with model
calls at a few chosen points, rather than a prompt, a bag of tools, and a loop
that runs until done.

**4. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** — Anthropic, the *augmented LLM* and *agents* sections · ~10 min re-read
You read this in Chapter 1 for the line between workflows and agents. Return to
the agent section for the stopping discussion in particular: agents run until
they hit a stopping condition, and the piece is unusually candid about what
happens when that condition is never met.

## Going deeper

- **[Agent Harness Architecture: Building a Coding Agent From Scratch](https://levelup.gitconnected.com/agent-harness-architecture-building-a-coding-agent-from-scratch-ad42a86a74e8)** walks the loop end to end in code, including the headless-runtime separation. The loop must not be coupled to how a user watches it, and that decoupling is what makes the event-driven loop possible at all.
- **[Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)**, in its self-improvement sections, takes the hill-climbing loop seriously: cycles of failure analysis, bounded edits, and validation.
- **[Context engineering: memory, compaction, and tool clearing](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools)** from the Claude Cookbook is runnable, and covers the loop-maintenance mechanics in executable form.

## Key concepts

**Agent loop, or ReAct loop.** Think, act, observe, and repeat.

**Stopping condition.** The explicit predicate that ends the loop. The kinds
worth knowing are goal-satisfied, budget-exhausted (in steps, tokens,
wall-clock time, or money), no-progress-detected, and human-halt. A production
loop needs at least three of the four; most hobby loops have zero, and rely on
the model volunteering to stop.

**Progress detection.** Distinguishing "still working" from "thrashing."
Repeated identical tool calls, oscillating edits, and a plateau in a
verification score are the cheap signals.

**Error compaction.** Turning a failure into the smallest piece of context that
lets the next iteration do better. Never the raw dump, and never nothing.

**Retry policy.** Which errors are retryable, with what backoff, and how many
times. The part everyone forgets is whether the retry is idempotent, which is
Chapter 6's territory.

**Loop stacking.** The inner loop stays bounded and cheap, while the outer
loops run slower, cost more, and are allowed to change the inner one.

**Headless runtime.** The loop decoupled from any interface, so that cron, a
webhook, and a human at a terminal are all just callers.

## Build this

Write the loop yourself, in whichever language you will use for Chapter 11 or
Chapter 12, and without a framework.

If you would rather read a working loop first,
[`reference-harness/`](../reference-harness/) implements this chapter in full,
and runs offline with `node harness.ts` on no dependencies and no API key. The
harness has since grown worked seams for seven chapters, but `harness.ts`
itself is still the loop and nothing else. Read it after you have attempted
your own, because the value is in hitting the problems yourself; the skeleton
is more useful as a comparison than as a starting point.

The requirements:

1. Tool dispatch from the model's structured output.
2. Four stopping conditions: goal, step budget, token budget, and no-progress.
3. Error compaction. On tool failure, append a one-line summary plus the first
   N characters of the error rather than the raw dump, and never append the
   same error twice in a row.
4. A step log written to disk as JSONL, one line per iteration.

Then break it deliberately. Give it a tool that always fails, and give it a
task it cannot complete. A loop you have not watched fail is a loop you do not
understand. Keep the JSONL, because Chapter 8 turns it into a trace.

## Check yourself

1. Name four independent stopping conditions and the failure each one catches. Which one catches the model declaring success without doing the work?
2. Why does interleaving reasoning with acting beat planning everything up front? What does the plan-first version lose, specifically?
3. You append a 4,000-token stack trace on every failed tool call and the loop retries five times. Describe the failure in tokens, and give two fixes.
4. Horthy says to own your control flow. What, concretely, can you no longer do once the loop belongs to a framework?
5. Which of the four loops is missing from almost every demo, and what does its absence mean for a task that runs overnight?
6. What does a stateless reducer of the form `(state, event) → state` buy you that an in-memory loop does not? Chapter 6 answers this in full; guess now.
