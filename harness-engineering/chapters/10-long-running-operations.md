# Chapter 10 — Long-running operations and the human interface

> **Core question:** The agent has been running for six hours. You went to lunch,
> came back, and need to know in ninety seconds whether to let it continue. What
> does the harness owe you?

## The problem

Chapters 1–9 make an agent capable of running for a long time. This chapter is
about the fact that a *person* has to live with it — and that turns out to be a
distinct engineering problem with its own failure modes, none of which are solved
by the previous nine chapters.

Three walls show up in every account of production long-running agents:

- **Context anxiety.** Models lose coherence as the window fills and start
  wrapping up prematurely — declaring done because the context is full, not
  because the work is finished. This is not the same as context rot; it is a
  behavioral response to it, and it is why Chapter 2's stopping conditions must
  include one that refuses a premature stop.
- **Self-grading.** An agent asked to evaluate its own work praises it, including
  when it is obviously mediocre. No amount of prompt tuning fixes this reliably.
- **The handoff.** A session ends — context reset, crash, human returning after
  hours — and whatever was in the model's head is gone. What survives is only what
  was written down.

The answers the field has converged on are unusually consistent across
independent teams, which is a good sign they are real: **separate the generator
from the evaluator**, **make state an artifact outside the process**, and **reset
context rather than only compacting it**.

## Core reading

**1. [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)** — Anthropic · ~40 min
The best single account of building a harness for tasks measured in hours.
Sections: why naive implementations fall short; making subjective quality
gradable; scaling to full-stack; iterating on the harness; what comes next. Four
things to take from it:
- **Context resets over compaction.** For long tasks they clear the window
  entirely and hand off through structured artifacts, rather than compacting.
  Read this as a direct challenge to Chapter 4 — a *clean* slate plus a good
  handoff document beats a *lossy* continuous one. Decide which your task wants.
- **Generator/evaluator separation.** A GAN-shaped split: one agent produces,
  a separate skeptical agent grades against concrete criteria. Motivated
  explicitly by the self-grading failure.
- **The sprint contract.** Before work starts, generator and evaluator *negotiate
  what "done" means* for that chunk. Chapter 8's rubric, agreed up front rather
  than applied after — which is what makes the fail criteria enforceable.
- **Hard fail thresholds.** Any criterion below threshold fails the sprint and
  returns specific feedback. Not a score, a gate.

The most instructive detail is at the end: a later model handled the work without
the sprint decomposition at all, and they removed it. **Harness complexity is a
function of model capability and should be re-litigated as models change.** That
is the honest ending, and it is rarer than it should be.

**2. [Long-running Agents](https://addyosmani.com/blog/long-running-agents/)** — Addy Osmani · ~35 min
The comparative survey: what "long-running" means, the three walls, the Ralph
loop, and how Anthropic, Cursor (planners/workers/judges), and Google each solve
it, ending in five production patterns. The load-bearing sentence is *"state lives
outside the agent's context"* — explicit plan files, explicit progress files,
structured handoffs, generation separated from evaluation, and a loop that refuses
to let the agent stop early. Read it after the Anthropic piece for the
triangulation; three independent teams converging is the argument.

**3. [Agent Handoff Patterns: human–agent interface guide](https://www.augmentcode.com/guides/agent-handoff-patterns-human-agent-interface)** — Augment Code · ~30 min
The handoff as a first-class design object: structured transfers of control
between agent and human reviewer, with persistent context, escalation logic, and
calibrated approvals deciding whether work resumes cleanly or stalls in review.
"Stalls in review" is the failure this chapter exists to prevent, and it is an
*interface* failure, not a capability one.

**4. [Humans and Agents in Software Engineering Loops](https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html)** — Fowler / Boeckeler · ~25 min
Where the human actually sits in the loop, and the honest treatment of what
supervision costs the supervisor. The necessary counterweight to the automation
enthusiasm in the other three.

**5. [Interaction as Intelligence Part II: Asynchronous Human–Agent Rollout for Long-Horizon Task Training](https://arxiv.org/abs/2510.27630)** · ~40 min
The research version: infrastructure for fine-grained asynchronous supervision
over 30+ hour runs, letting humans monitor and steer *without* interrupting the
rollout. Read for the interaction model — non-blocking supervision is the property
that makes long-horizon agents tolerable to work with, and almost nothing
implements it.

**6. [SlopCodeBench: Benchmarking How Coding Agents Degrade Over Long-Horizon Iterative Tasks](https://arxiv.org/abs/2603.24755)** · ~35 min
Read this against the four sources above, because it is the one that disagrees
with them. They describe patterns that make long runs work; this measures how
long runs actually go, by chaining agent output across checkpoints and scoring
quality at every step.

Two findings worth taking seriously. Across 11 models and 20 iterative problems,
**no agent solved a problem end-to-end.** And degradation resumes at the same
rate regardless of initial quality — so a better starting point buys you distance,
not immunity.

That is the empirical floor under this chapter's "three walls." The practitioner
accounts tell you how to go further; this tells you that you will still stop.
Design the handoff, because the handoff is not an edge case.

**7. [Measuring AI Ability to Complete Long Tasks](https://arxiv.org/abs/2503.14499)** — METR · ~30 min
The measurement that gives "long-horizon" a unit. Rather than scoring tasks
pass/fail, it asks *how long a task, measured in human time, can a model complete
at a given reliability* — producing a task-completion horizon that has been
lengthening on a consistent trend. Read it for the framing: **horizon is the
variable**, and a harness is a device for extending it beyond what the model
manages unaided. It also gives you the right way to state a capability claim —
"50% success at four-hour tasks" says something; "it's good at agentic work"
does not.

## Going deeper

- **[Long-running AI agents that pause, resume, and never lose context (ADK)](https://developers.googleblog.com/build-long-running-ai-agents-that-pause-resume-and-never-lose-context-with-adk/)** — Google's take; pairs with Chapter 6.
- **[Long Running Agent Engineering](https://nicolasbustamante.com/blog/long-running-agent-engineering)** — practitioner account; strong on git as the coordination substrate between a local human and a remote agent.
- **[Awesome Agentic Patterns](https://www.agentic-patterns.com/)** — 97 patterns in 8 categories, each requiring a public reference and use by more than one team. The *UX & Collaboration* category is this chapter's bibliography; the whole catalogue is a good index for the curriculum.
- **[The Shift to Agentic AI: Evidence from Codex](https://arxiv.org/abs/2606.26959)** — large-scale usage study. The number relevant here: requests for tasks requiring **8+ hours rose nearly tenfold** in the first half of 2026, and over 10% of users ran three or more concurrent agents weekly. Long-horizon supervision is becoming the common case, not the exotic one. (Read the productivity multiples with care — they are token-output counts from the vendor's own staff, not measures of delivered value.)
- **[The Horizon Gap: Planning, Memory, Execution, Training, and Evaluation for Long-Horizon LLM Agents](https://arxiv.org/abs/2608.06663)** — the survey covering this chapter's territory academically.
- **[Wink: Recovering from Misbehaviors in Coding Agents](https://arxiv.org/abs/2602.17037)** — measures *engineer interventions per session* as a first-class metric, which is the right thing to instrument if you are serious about the human interface.
- **[NL2Repo-Bench](https://arxiv.org/abs/2512.12730)** — long-horizon repository generation; performance rises steadily as the interaction limit goes from 50 to 200 rounds, which is a useful counterweight to the degradation result above.

## Key concepts

- **Context anxiety** — losing coherence as the window fills and wrapping up early.
  A stopping-condition bug, not a capability limit.
- **Context reset vs. compaction** — clear the window and hand off through an
  artifact, rather than summarize in place. The live disagreement with Chapter 4.
- **Handoff artifact** — the structured document that carries state across a reset,
  a crash, or a human absence. If it isn't written down, it doesn't survive.
- **Plan file / progress file** — externalized intent and externalized status.
  The minimum viable handoff artifact.
- **Generator/evaluator separation** — different agents produce and judge, because
  self-grading is unreliable in a specific and predictable direction.
- **Sprint contract** — agreeing what "done" means *before* the work, so the fail
  criteria are enforceable rather than negotiable after the fact.
- **Hard fail threshold** — a gate, not a score.
- **Refusal to stop early** — an explicit "really done?" check. The stopping
  condition that catches the false positive.
- **Non-blocking supervision** — steering without interrupting the rollout.
- **Escalation logic** — what the agent must ask about, versus decide alone. The
  policy that determines whether a human is a bottleneck or a backstop.
- **Harness complexity as a function of model capability** — scaffolding that a
  better model makes unnecessary. Re-litigate it; don't keep it out of sentiment.

## Build this

Make your harness survivable by a human who was not watching.

1. **Handoff artifact.** Define its schema: goal, constraints, decisions made and
   why, what has been tried and failed, current state, next action, open questions.
   The agent maintains it continuously — not at the end, when it may not get there.
2. **Reset, don't just compact.** Add a context reset that clears the window and
   restarts from the handoff artifact alone. Now run the Chapter 4 experiment a
   fourth time, with reset instead of compaction, and compare all four.
3. **Split the roles.** Separate generator from evaluator, with the evaluator in
   its own context and no access to the generator's reasoning. Have them agree a
   sprint contract before each chunk.
4. **Refuse the early stop.** Add the stopping condition that catches premature
   completion: when the agent claims done, an evaluator in a *fresh* context checks
   against the original goal, not the conversation.
5. **The ninety-second view.** Build the status surface: what is it doing, how far
   along, what has it decided, what is it stuck on, what would it like permission
   for. Test it by leaving for an hour and coming back.
6. **Non-blocking steer.** Add a channel where you can inject guidance that the
   agent picks up at the next iteration boundary without being interrupted.

## Check yourself

1. What is context anxiety, and which of Chapter 2's stopping conditions catches it?
2. Anthropic prefers context *resets* to compaction for long tasks. Give the
   argument, and name a task where compaction is still the better choice.
3. Why is self-grading unreliable in a predictable direction, and why does
   separating the evaluator help when it is the same underlying model?
4. What must a handoff artifact contain for a fresh session to continue without
   re-deriving anything? Write the schema.
5. What does a sprint contract get you that a rubric applied afterward does not?
6. Design the ninety-second status view for a nine-hour migration. What five things
   does it show, and what does it deliberately omit?
7. Anthropic removed the sprint construct when a better model made it unnecessary.
   What in *your* harness is scaffolding for a limitation that may not still exist,
   and how would you find out?
8. Non-blocking supervision vs. approval gates (Ch.9): when do you want each, and
   what breaks if you use the wrong one?
9. No agent in SlopCodeBench solved a problem end to end, and degradation resumed
   at the same rate regardless of starting quality. What does that imply about
   where to spend effort — on making the agent go further, or on making the stop
   cheap? Defend your answer against the opposite one.
10. State a capability claim about your own harness in METR's form: what task
   length, at what reliability? If you cannot, what would you have to measure?
