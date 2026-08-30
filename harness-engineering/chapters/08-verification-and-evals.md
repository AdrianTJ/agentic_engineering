# Chapter 8 — Verification, evals & observability

> **Core question:** The agent says it finished. Is it right, and how would you
> know at three in the morning, on run 4,000, without reading a transcript?

## The problem

Long-horizon tasks defeat human review by construction, because nobody reads a
nine-hour transcript. Verification therefore has to be part of the harness
rather than a person downstream. This is the feedback half of Fowler's
cybernetic governor, and it splits three ways. Verification is in-loop checking
that changes what the agent does next, which is Chapter 2's second loop.
Evaluation is offline measurement that tells you whether a harness change
helped. Observability is the trace record that makes both possible, and that
answers what happened after the fact.

The order matters. You cannot evaluate without traces, and you cannot improve
without evaluation. This chapter is what makes Chapter 1's hill-climbing loop
possible, which is why it closes the arc.

One principle governs all three, and it is the most valuable sentence in the
chapter: prefer cheap deterministic verification wherever it exists. A type
checker, a test suite, a linter, a schema validator, or a compile step is
faster and cheaper than a model, and, decisively, its failure mode is legible.
Reach for a model-based judge only for what genuinely cannot be checked
mechanically. Fowler's insistence on ArchUnit tests and custom linters as
guardrails is exactly this argument, and it is the main defense against a
harness whose quality signal is as unreliable as the thing it measures.

## Core reading

**1. [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering)** — the verification and hill-climbing loops · ~15 min re-read
You read this in Chapter 2 for the taxonomy. Return to it for loops two and
four specifically: a grader checking output against a rubric and feeding
failures back, and an analysis agent reading production traces in order to
change the harness itself. The second one is the payoff of the whole
curriculum, a harness improving from evidence rather than from opinion.

**2. [Agent observability: the complete guide](https://www.braintrust.dev/articles/agent-observability-complete-guide-2026)** — Braintrust · ~35 min
The practitioner's guide. The distinction to hold onto is online as against
offline evaluation. Online scorers run inline on live traces so that
regressions surface as they happen, while offline evaluation re-runs a fixed
dataset on every change. You need both, and they answer different questions.
The other split worth keeping is between code-based scorers, which are
objective, cheap, and deterministic, and the model-as-judge approach, which is
nuanced, expensive, and itself in need of evaluation.

**3. [OpenTelemetry GenAI semantic conventions](https://greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions)** · ~25 min
The standard. Instrument to the OTel GenAI conventions and your traces are
portable across vendors; instrument ad hoc and you will migrate twice. The
conventions cover model calls, agent orchestration, MCP tool calling, content
capture, and quality evaluation. The section on content capture deserves a slow
read, because it is also a privacy decision, in Chapter 9's sense.

**4. [LLM tracing and agent observability](https://mlflow.org/docs/latest/genai/tracing/)** — MLflow · ~30 min, hands-on
An OTel-compatible open implementation. Read it for what a trace contains,
which is the full execution tree: every model call, tool invocation, and
retrieval step, along with the reasoning that connects them, with inputs,
outputs, latency, and cost on every span. Instrument the Chapter 6 loop with it
and you will never go back to print statements.

**5. [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents)** — the evaluation phase · ~10 min re-read
This is the tightest worked example of eval-driven harness development in the
literature. Build the eval set, watch the misuse, fix the description, and
measure. Generalize the method beyond tools, because it is how you should
change any part of a harness.

**6. [Terminal-Bench](https://www.tbench.ai/)** and **[the SWE-bench harness](https://www.swebench.com/SWE-bench/reference/harness/)** · ~30 min
Read an evaluation harness as a design artifact, because it is one, and because
building your regression suite means building a small one of your own.

A Terminal-Bench task is four things: a natural-language instruction, a
sandboxed workspace, an executable test script, and a reference solution.
Success is defined as transforming the environment into a passing state rather
than as producing the right text. That is the shape your own eval tasks should
take, and the executable test script is the item that hobby evals omit.

One design note is worth carrying. Terminal interaction makes a good evaluation
substrate precisely because it jointly exercises observation design, context
management, control-loop policy, action exposure, state persistence, and
verification, which is to say Chapters 4, 2, 5, 6, and this one. An eval that
touches only one of them tells you about one of them.

Notice also the scale of the human effort involved. Ninety-three contributors
produced 229 candidate tasks, of which 89 survived review by three experienced
reviewers, meaning roughly 60 percent of proposed tasks were rejected. Budget
accordingly when you write your own, because task quality rather than task
count is what makes a suite informative.

## Going deeper

- **[Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)** covers evolutionary search over harness configurations and joint optimization with model weights. This is where hill climbing goes when you take it seriously.
- **[TDD inside the agent loop — theater or actual value?](https://martinfowler.com/articles/exploring-gen-ai/tdd-in-the-agent-loop.html)**, by Martin Fowler and Birgitta Boeckeler, interrogates whether test-driven agent loops deliver what they appear to. Read it as an antidote to verification theater.
- **[SWE-EVO: Benchmarking Coding Agents in Long-Horizon Software Evolution Scenarios](https://arxiv.org/abs/2512.18470)** shows what a long-horizon benchmark has to do differently from a single-task one.
- **[AI Agent Observability](https://www.langchain.com/resources/agent-observability)** is LangChain's version, and its trace-tree framing is well explained.

## Key concepts

**Verification as against evaluation.** In-loop checking changes behavior now,
while offline measurement changes the harness later.

**Rubric, or grader.** The explicit criteria a verification loop checks
against. Writing the rubric is most of the work.

**Model as judge.** Necessary for what cannot be mechanized. It needs its own
eval, and it drifts, so it is never the first choice.

**Deterministic verification.** Compilers, tests, linters, and schema
validation. The cheapest and most legible option, and always preferred where
available.

**Trace and span.** The execution tree. Spans nest, and each carries inputs,
outputs, latency, and cost.

**OTel GenAI semantic conventions.** The portability standard for the above.

**Online as against offline evals.** Live scoring on production traces, as
against a fixed dataset re-run on every change.

**Regression suite.** The tasks that must keep passing, and the thing that
makes harness changes safe to ship.

**Hill climbing.** Reading traces to change the harness, systematically.

**Verification theater.** Checks that produce a green signal without evidence
of correctness. This is the dominant failure mode of enthusiastic eval
adoption.

## Build this

Close the loop on the harness you have been building since Chapter 2.

1. Instrument. Emit OTel-compatible spans for every model call and tool call,
   carrying inputs, outputs, tokens, latency, and cost, with one trace per task
   run.
2. Build a regression set of ten tasks with checkable success criteria, at
   least seven of them verified deterministically through an exit code, file
   content, a passing test, or a schema match.
3. Add the verification loop. After the agent claims completion, run the
   deterministic checks, and on failure feed a compacted failure report back in
   the Chapter 2 style and continue rather than stopping.
4. Add the offline eval: a script that runs all ten tasks and reports pass
   rate, mean tokens, mean wall-clock time, and mean cost. Commit the baseline.
5. Hill climb, and keep yourself honest while doing it. Read the traces of the
   failures, form one hypothesis, change one thing, and re-run. Record the
   delta whether or not the change helped, and especially when it did not.
6. Do step 5 three times, and keep the log. That log is the artifact, and it is
   what harness engineering actually looks like day to day.

Then update your Chapter 1 inventory one more time, filling in the planning and
verification loops row. It is the primitive most often missing, and you have
just built it.

## Check yourself

1. Give three verifications for a coding agent that need no model at all. Why is each better than a judge?
2. When is a model-based judge genuinely unavoidable, and what must you build alongside it?
3. What breaks if you have evals but no traces? What about traces but no evals?
4. Why does an OTel-conformant trace matter more than a richer proprietary one?
5. Design the verification loop for a nine-hour migration. What is checked, when, and what happens on a failure at hour eight?
6. Your pass rate went from 60 to 70 percent on ten tasks. What can you actually conclude, and what would you need in order to conclude more?
7. Describe a plausible piece of verification theater in an agent harness, and the trace evidence that would expose it.
