# Chapter 10 — Long-running operations and the human interface

> **Core question:** The agent has been running for six hours. You went to
> lunch, came back, and need to know in ninety seconds whether to let it
> continue. What does the harness owe you?

## The problem

Chapters 1 through 9 make an agent capable of running for a long time. This
chapter is about the fact that a person has to live with it, which turns out to
be a distinct engineering problem with its own failure modes, and none of them
are solved by the previous nine chapters.

Three walls show up in every account of production long-running agents. The
first is context anxiety. Models lose coherence as the window fills and start
wrapping up prematurely, declaring the work done because the context is full
rather than because the work is finished. This differs from context rot; it is
the behavioral response to it, and it is the reason Chapter 2's stopping
conditions must include one that refuses a premature stop. The second wall is
self-grading. An agent asked to evaluate its own work praises it, including
when the quality is obviously mediocre, and no amount of prompt tuning fixes
this reliably. The third is the handoff. A session ends, whether through a
context reset, a crash, or a human returning after hours away, and whatever was
in the model's head is gone. What survives is only what was written down.

The answers the field has converged on are unusually consistent across
independent teams, which is a good sign they are real. Separate the generator
from the evaluator, make state an artifact outside the process, and reset the
context rather than only compacting it.

## Core reading

**1. [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)** — Anthropic · ~40 min
This is the best single account of building a harness for tasks measured in
hours. Its sections cover why naive implementations fall short, how to make
subjective quality gradable, scaling to full-stack work, iterating on the
harness, and what comes next. Take four things from it.

First, context resets over compaction. For long tasks they clear the window
entirely and hand off through structured artifacts rather than compacting.
Read this as a direct challenge to Chapter 4, a clean slate plus a good
handoff document set against a lossy continuous window, and decide which your
task wants. Second, generator and evaluator separation, a GAN-shaped split in
which one agent produces while a separate and skeptical agent grades against
concrete criteria, motivated explicitly by the self-grading failure. Third,
the sprint contract. Before work starts, the generator and evaluator negotiate
what "done" means for that chunk, which is Chapter 8's rubric agreed up front
rather than applied afterward, and it is what makes the fail criteria
enforceable. Fourth, hard fail thresholds. Any criterion below its threshold
fails the sprint and returns specific feedback, making it a gate rather than a
score.

The most instructive detail arrives at the end. A later model handled the work
without the sprint decomposition at all, so they removed it. Harness
complexity is a function of model capability, and it should be re-litigated as
models change. Endings like that are rarer than they should be.

**2. [Long-running Agents](https://addyosmani.com/blog/long-running-agents/)** — Addy Osmani · ~35 min
The comparative survey. It covers what long-running actually means, the three
walls, the Ralph loop, and how Anthropic, Cursor with its planners, workers,
and judges, and Google each solve the problem, before closing with five
production patterns. The load-bearing sentence is that "state lives outside
the agent's context," which cashes out as explicit plan files, explicit
progress files, structured handoffs, generation separated from evaluation, and
a loop that refuses to let the agent stop early. Read it after the Anthropic
piece for the triangulation, because three independent teams converging is the
argument.

**3. [Agent Handoff Patterns: human–agent interface guide](https://www.augmentcode.com/guides/agent-handoff-patterns-human-agent-interface)** — Augment Code · ~30 min
This treats the handoff as a first-class design object: structured transfers
of control between agent and human reviewer, with persistent context,
escalation logic, and calibrated approvals deciding whether work resumes
cleanly or stalls in review. Stalling in review is the failure this chapter
exists to prevent, and it is an interface failure rather than a capability
one.

**4. [Humans and Agents in Software Engineering Loops](https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html)** — Fowler / Boeckeler · ~25 min
This covers where the human actually sits in the loop, with a clear-eyed
account of what supervision costs the supervisor. It is the necessary
counterweight to the automation enthusiasm in the other pieces.

**5. [Interaction as Intelligence Part II: Asynchronous Human–Agent Rollout for Long-Horizon Task Training](https://arxiv.org/abs/2510.27630)** · ~40 min
The research version: infrastructure for fine-grained asynchronous supervision
over runs of thirty hours and more, letting humans monitor and steer without
interrupting the rollout. Read it for the interaction model. Non-blocking
supervision is the property that makes long-horizon agents tolerable to work
with, and almost nothing implements it.

**6. [SlopCodeBench: Benchmarking How Coding Agents Degrade Over Long-Horizon Iterative Tasks](https://arxiv.org/abs/2603.24755)** · ~35 min
Read this against the sources above, because it is the one that disagrees with
them. They describe patterns that make long runs work, while this measures how
long runs actually go, by chaining agent output across checkpoints and scoring
quality at every step.

Two findings deserve to be taken seriously. Across eleven models and twenty
iterative problems, no agent solved a problem end to end. And degradation
resumes at the same rate regardless of initial quality, so a better starting
point buys you distance rather than immunity.

That is the empirical floor under this chapter's three walls. The practitioner
accounts tell you how to go further, and this benchmark tells you that you
will still stop. Design the handoff, because the handoff is not an edge case.

**7. [Measuring AI Ability to Complete Long Tasks](https://arxiv.org/abs/2503.14499)** — METR · ~30 min
This is the measurement that gives "long-horizon" a unit. Rather than scoring
tasks pass or fail, it asks how long a task, measured in human time, a model
can complete at a given reliability, which produces a task-completion horizon
that has been lengthening on a consistent trend. Read it for the framing:
horizon is the variable, and a harness is a device for extending it beyond
what the model manages unaided. It also supplies the right way to state a
capability claim. Fifty percent success at four-hour tasks says something,
while "it is good at agentic work" does not.

## Going deeper

- **[Long-running AI agents that pause, resume, and never lose context (ADK)](https://developers.googleblog.com/build-long-running-ai-agents-that-pause-resume-and-never-lose-context-with-adk/)** is Google's take, and pairs with Chapter 6.
- **[Long Running Agent Engineering](https://nicolasbustamante.com/blog/long-running-agent-engineering)** is a practitioner account, strong on git as the coordination substrate between a local human and a remote agent.
- **[Awesome Agentic Patterns](https://www.agentic-patterns.com/)** catalogues 97 patterns in eight categories, each requiring a public reference and use by more than one team. The UX and collaboration category is this chapter's bibliography, and the whole catalogue is a good index for the curriculum.
- **[The Shift to Agentic AI: Evidence from Codex](https://arxiv.org/abs/2606.26959)** is a large-scale usage study. The number relevant here is that requests for tasks requiring eight or more hours rose nearly tenfold in the first half of 2026, and over ten percent of users ran three or more concurrent agents weekly, so long-horizon supervision is becoming the common case rather than the exotic one. Read the productivity multiples with care, since they are token-output counts from the vendor's own staff rather than measures of delivered value.
- **[The Horizon Gap: Planning, Memory, Execution, Training, and Evaluation for Long-Horizon LLM Agents](https://arxiv.org/abs/2608.06663)** is the survey covering this chapter's territory academically.
- **[Wink: Recovering from Misbehaviors in Coding Agents](https://arxiv.org/abs/2602.17037)** measures engineer interventions per session as a first-class metric, which is the right thing to instrument if you are serious about the human interface.
- **[NL2Repo-Bench](https://arxiv.org/abs/2512.12730)** covers long-horizon repository generation, where performance rises steadily as the interaction limit goes from 50 to 200 rounds. It is a useful counterweight to the degradation result above.

## Key concepts

**Context anxiety.** Losing coherence as the window fills and wrapping up
early. A stopping-condition bug rather than a capability limit.

**Context reset as against compaction.** Clear the window and hand off through
an artifact, rather than summarizing in place. This is the live disagreement
with Chapter 4.

**Handoff artifact.** The structured document that carries state across a
reset, a crash, or a human absence. If it was not written down, it does not
survive.

**Plan file and progress file.** Externalized intent and externalized status,
and together the minimum viable handoff artifact.

**Generator and evaluator separation.** Different agents produce and judge,
because self-grading is unreliable in a specific and predictable direction.

**Sprint contract.** Agreeing what "done" means before the work starts, so the
fail criteria are enforceable rather than negotiable after the fact.

**Hard fail threshold.** A gate rather than a score.

**Refusal to stop early.** An explicit really-done check, and the stopping
condition that catches the false positive.

**Non-blocking supervision.** Steering without interrupting the rollout.

**Escalation logic.** What the agent must ask about, as against what it may
decide alone. This policy determines whether a human is a bottleneck or a
backstop.

**Harness complexity as a function of model capability.** Scaffolding that a
better model makes unnecessary. Re-litigate it rather than keeping it out of
sentiment.

## Build this

Make your harness survivable by a human who was not watching.

1. Define the handoff artifact and its schema: the goal, the constraints, the
   decisions made and why, what has been tried and failed, the current state,
   the next action, and the open questions. The agent maintains it
   continuously rather than at the end, when it may not get there.
2. Reset rather than only compacting. Add a context reset that clears the
   window and restarts from the handoff artifact alone, then run the Chapter 4
   experiment a fourth time with reset in place of compaction, and compare all
   four policies.
3. Split the roles. Separate the generator from the evaluator, with the
   evaluator in its own context and no access to the generator's reasoning,
   and have them agree a sprint contract before each chunk.
4. Refuse the early stop. Add the stopping condition that catches premature
   completion: when the agent claims to be done, an evaluator in a fresh
   context checks the claim against the original goal rather than against the
   conversation.
5. Build the ninety-second view, a status surface showing what the agent is
   doing, how far along it is, what it has decided, what it is stuck on, and
   what it would like permission for. Test it by leaving for an hour and
   coming back.
6. Add a non-blocking steer: a channel where you can inject guidance that the
   agent picks up at the next iteration boundary without being interrupted.

[`reference-harness/`](../reference-harness/) works steps 1 and 2:

```sh
POLICY=reset SCRIPT=long node harness.ts   # reset at threshold, continue from the artifact
cat .state/HANDOFF.md
```

Read its README for the bug this produced, because it is this chapter's blind
spot. The first handoff had no bound on its Done list, so the artifact grew
every step until it was itself filling the window, and resets fired twice as
often as they should have. A context reset does not escape the retention
problem; it relocates it. Compaction decides what to drop inside an opaque
summary, while a handoff decides it in a file you can read. The second is
auditable, and neither is free.

Note also what the harness cannot tell you. In its measurements, `reset` bills
more than compaction, but its model is a deterministic script that cannot
suffer context anxiety, which is the failure reset exists to prevent. The
measurement captures reset's cost and nothing of its benefit, so treat any
cost-only comparison of these policies, including that one, as half an
argument.

## Check yourself

1. What is context anxiety, and which of Chapter 2's stopping conditions catches it?
2. Anthropic prefers context resets to compaction for long tasks. Give the argument, and name a task where compaction is still the better choice.
3. Why is self-grading unreliable in a predictable direction, and why does separating the evaluator help when it is the same underlying model?
4. What must a handoff artifact contain for a fresh session to continue without re-deriving anything? Write the schema.
5. What does a sprint contract get you that a rubric applied afterward does not?
6. Design the ninety-second status view for a nine-hour migration. What five things does it show, and what does it deliberately omit?
7. Anthropic removed the sprint construct when a better model made it unnecessary. What in your harness is scaffolding for a limitation that may no longer exist, and how would you find out?
8. Non-blocking supervision as against approval gates, in Chapter 9's sense: when do you want each, and what breaks if you use the wrong one?
9. No agent in SlopCodeBench solved a problem end to end, and degradation resumed at the same rate regardless of starting quality. What does that imply about where to spend effort, on making the agent go further or on making the stop cheap? Defend your answer against the opposite one.
10. State a capability claim about your own harness in METR's form: what task length, at what reliability? If you cannot, what would you have to measure first?
