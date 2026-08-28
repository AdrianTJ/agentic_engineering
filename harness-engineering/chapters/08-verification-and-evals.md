# Chapter 8 — Verification, evals & observability

> **Core question:** The agent says it finished. Is it right — and how would you
> know at 3am, on run 4,000, without reading a transcript?

## The problem

Long-horizon tasks defeat human review by construction: nobody reads a nine-hour
transcript. So verification must be part of the harness, not a person downstream.
This is the feedback half of Fowler's cybernetic governor, and it splits three ways:

- **Verification** — in-loop checking that changes what the agent does next (Ch.2's second loop).
- **Evaluation** — offline measurement that tells you whether a harness change helped.
- **Observability** — the trace record that makes both possible, and that answers "what happened" after the fact.

The order matters: you cannot evaluate without traces, and you cannot improve
without evaluation. This chapter is what makes Ch.1's hill-climbing loop possible,
which is why it closes the arc.

One principle governs all three and is the most valuable sentence in the chapter:
**prefer cheap deterministic verification wherever it exists.** A type checker, a
test suite, a linter, a schema validator, or a compile step is faster, cheaper,
and — decisively — has a *legible failure mode*. Reach for an LLM judge only for
what genuinely cannot be checked mechanically. Fowler's insistence on ArchUnit
tests and custom linters as guardrails is exactly this argument, and it is the
main defense against a harness whose quality signal is as unreliable as the thing
it measures.

## Core reading

**1. [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering)** — the verification and hill-climbing loops · ~15 min re-read
You read this in Ch.2 for the taxonomy. Return for loops 2 and 4 specifically:
a grader checking output against a rubric and feeding failures back, and an
analysis agent reading production traces to *change the harness*. The second is
the payoff of the whole curriculum — the harness improving from evidence rather
than from opinion.

**2. [Agent observability: the complete guide](https://www.braintrust.dev/articles/agent-observability-complete-guide-2026)** — Braintrust · ~35 min
The practitioner's guide. The distinction to hold onto is **online** vs. **offline**
evaluation: scorers running inline on live traces so regressions surface as they
happen, versus a fixed dataset you re-run on every change. You need both and they
answer different questions. Also the split between code-based scorers (objective,
cheap, deterministic) and LLM-as-a-judge (nuanced, expensive, itself in need of
evaluation).

**3. [OpenTelemetry GenAI semantic conventions](https://greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions)** · ~25 min
The standard. Instrument to OTel GenAI conventions and your traces are portable
across vendors; instrument ad hoc and you will migrate twice. Covers LLM calls,
agent orchestration, MCP tool calling, content capture, and quality evaluation.
The section on content capture deserves a slow read — it is also a privacy
decision (Ch.9).

**4. [LLM tracing and agent observability](https://mlflow.org/docs/latest/genai/tracing/)** — MLflow · ~30 min, hands-on
An OTel-compatible open implementation. Read for what a trace *contains*: the
full execution tree — every model call, tool invocation, retrieval step, and the
reasoning connecting them — with inputs, outputs, latency and cost per span.
Instrument the Ch.6 loop with it and you will never go back to print statements.

**5. [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents)** — the evaluation phase · ~10 min re-read
The tightest worked example of eval-driven harness development in the literature:
build the eval set, watch the misuse, fix the description, measure. Generalize the
method beyond tools — it's how you should change *any* part of a harness.

**6. [Terminal-Bench](https://www.tbench.ai/)** and **[the SWE-bench harness](https://www.swebench.com/SWE-bench/reference/harness/)** · ~30 min
Read an evaluation harness as a design artifact, because it is one — and because
building your regression suite is building a small one.

A Terminal-Bench task is four things: a natural-language instruction, a sandboxed
workspace, **an executable test script**, and a reference solution. Success is
defined as transforming the environment into a passing state — not as producing
the right text. That is the shape your own eval tasks should take, and the third
item is the one hobby evals omit.

The design note worth carrying: terminal interaction is a good evaluation
substrate precisely because it *jointly* exercises observation design, context
management, control-loop policy, action exposure, state persistence, and
verification. Those are Chapters 4, 2, 5, 6 and this one. An eval that touches
only one of them tells you about one of them.

Note also the scale of the human effort — 93 contributors produced 229 candidate
tasks, of which 89 survived review by three experienced reviewers. **Roughly 60%
of proposed tasks were rejected.** Budget accordingly when you write your own;
task quality, not task count, is what makes a suite informative.

## Going deeper

- **[Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)** — evolutionary search over harness configurations and joint optimization with weights. Where hill-climbing goes when you take it seriously.
- **[TDD inside the agent loop — theater or actual value?](https://martinfowler.com/articles/exploring-gen-ai/tdd-in-the-agent-loop.html)** — Martin Fowler / Birgitta Boeckeler — an honest interrogation of whether test-driven agent loops deliver what they appear to. Read it as an antidote to verification theater.
- **[SWE-EVO: Benchmarking Coding Agents in Long-Horizon Software Evolution Scenarios](https://arxiv.org/abs/2512.18470)** — what a long-horizon benchmark has to do differently from a single-task one.
- **[AI Agent Observability](https://www.langchain.com/resources/agent-observability)** — LangChain's version; the trace-tree framing is well explained.

## Key concepts

- **Verification vs. evaluation** — in-loop, changes behavior now; offline, changes the harness later.
- **Rubric / grader** — the explicit criteria a verification loop checks against. Writing the rubric is most of the work.
- **LLM-as-a-judge** — necessary for the unmechanizable; itself needs an eval, and drifts. Never the first choice.
- **Deterministic verification** — compiler, tests, linters, schema validation. Cheapest, most legible, always preferred where available.
- **Trace / span** — the execution tree; spans nest and carry inputs, outputs, latency, cost.
- **OTel GenAI semantic conventions** — the portability standard for the above.
- **Online vs. offline eval** — live scoring vs. fixed dataset.
- **Regression suite** — the tasks that must keep passing. The thing that makes harness changes safe to ship.
- **Hill climbing** — reading traces to change the harness, systematically.
- **Verification theater** — checks that produce a green signal without evidence of correctness. The dominant failure mode of enthusiastic eval adoption.

## Build this

Close the loop on the harness you have been building since Ch.2.

1. **Instrument.** Emit OTel-compatible spans for every model call and tool call:
   inputs, outputs, tokens, latency, cost. One trace per task run.
2. **Regression set.** Ten tasks with checkable success criteria — at least seven
   verified *deterministically* (exit code, file content, test pass, schema match).
3. **Verification loop.** After the agent claims completion, run the deterministic
   checks. On failure, feed a compacted failure report back (Ch.2 error compaction)
   and continue rather than stopping.
4. **Offline eval.** A script that runs all ten and reports pass rate, mean tokens,
   mean wall-clock, mean cost. Commit the baseline.
5. **Hill climb, honestly.** Read the traces of the failures. Form *one* hypothesis.
   Change *one* thing. Re-run. Record the delta whether or not it helped —
   especially if it didn't.
6. Do step 5 three times, and keep the log. That log is the artifact; it is what
   harness engineering actually looks like day to day.

Update your Ch.1 inventory one more time: *planning and verification loops*. This
is the primitive most often missing, and you have just built it.

## Check yourself

1. Give three verifications for a coding agent that need no LLM. Why is each better than a judge?
2. When is an LLM judge genuinely unavoidable, and what must you build alongside it?
3. What breaks if you have evals but no traces? Traces but no evals?
4. Why does an OTel-conformant trace matter more than a richer proprietary one?
5. Design the verification loop for a nine-hour migration. What is checked, when, and what happens on failure at hour eight?
6. Your pass rate went 60% → 70% on ten tasks. What can you actually conclude, and what would you need to conclude more?
7. Describe a plausible piece of verification theater in an agent harness, and the trace evidence that would expose it.
