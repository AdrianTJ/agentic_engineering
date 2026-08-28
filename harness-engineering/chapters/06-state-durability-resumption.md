# Chapter 6 — State, durability, and resumption

> **Core question:** The process died at hour six. What happens now?

## The problem

Chapter 4 kept work alive across a *context window*. This chapter keeps it alive
across a *process*. They are different problems and the second one is older —
this is distributed systems, and the agent community has been rediscovering its
solutions, usually the hard way.

A genuinely long-horizon agent waits: for a build, for a human approval, for a
rate limit, for tomorrow. Anything that waits must survive restart, and anything
that survives restart faces the classic questions: where is the state, is
resumption exactly-once or at-least-once, are the effects idempotent, and can you
prove after the fact what happened?

The agent-specific twist is that the state is unusually awkward. It is part
conversation, part filesystem, part external side effects already committed to
the world. You cannot roll back a sent email. Durability design is largely about
being precise regarding which parts of your state are replayable and which are not.

## Core reading

**1. [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)** — factors #5, #6, #12 · ~30 min
The clearest short statement of agent state design, and the three factors are one
idea in three parts:
- **#12 Make your agent a stateless reducer.** `(state, event) → state`. The agent is a pure function; the state lives outside it. Everything else follows.
- **#5 Unify execution state and business state.** Don't keep "where the loop is" in one store and "what the task knows" in another — they drift, and the drift is unrecoverable.
- **#6 Launch / pause / resume with simple APIs.** If pause and resume are not first-class operations, human-in-the-loop and long waits are hacks.

**2. [Durable Execution meets AI: why Temporal is a good foundation for AI agents](https://temporal.io/blog/durable-execution-meets-ai-why-temporal-is-the-perfect-foundation-for-ai)** — Temporal · ~30 min
Vendor-authored, and still the best available explanation of the pattern. The
mechanism is **event sourcing**: record a full event history of every activity
call and result, so that after a crash the workflow is *replayed* deterministically
to where it was. Nothing is checkpointed in the snapshot sense; the log is the
state. Read past the product for the model — waits measured in days or weeks are
normal, retries are declarative, and "resume from a safe point without duplicating
business actions" is the actual requirement.

**3. [Temporal: Beyond State Machines for Reliable Distributed Applications](https://temporal.io/blog/temporal-replaces-state-machines-for-distributed-applications)** — ~25 min
The argument that hand-rolled state machines rot: every new state multiplies
transitions, and the explicit machine drifts from the real one. Relevant because
Ch.3's graph *is* a hand-rolled state machine, and this is the strongest available
critique of it.

**4. [Building LangGraph: designing an agent runtime from first principles](https://www.langchain.com/blog/building-langgraph)** — LangChain · ~15 min, targeted re-read
You read this in Ch.3 for the control-flow argument. Return for its durability
section, which is the direct rebuttal to #2 and #3: durable execution engines
predate LLM agents and therefore lack streaming, add latency between steps, and
degrade as agent histories grow. Its own answer is checkpointing at discrete step
boundaries, with state serialized so a run can resume "on any machine, an
arbitrary amount of time after" it was saved.

The detail worth stealing regardless of framework: **a pause for a human is the
same primitive as a pause for a clock.** Checkpointing means an interrupt is a real
interruption — nothing is held running while it waits — so approval "scales neither
in time nor in volume." That is the property that makes Ch.10's human interface
affordable, and most hand-rolled harnesses block a process instead.

**5. [LangGraph State: Checkpoints, Threads, and Recovery](https://eastondev.com/blog/en/posts/ai/20260424-langgraph-agent-architecture/)** · ~25 min
Durability inside a graph framework: a checkpointer (SQLite, Postgres) makes state
persistent, so agents can crash, resume, and **rewind** — re-run from an earlier
state with a change. Rewind is the underrated capability: it turns debugging a
long-horizon agent from archaeology into an experiment.

**6. [Agent Workflows Are Rediscovering Durable Execution](https://medium.com/beyond-localhost/agent-workflows-are-rediscovering-durable-execution-be110661ed8c)** · ~20 min
The synthesis, and the chapter's thesis in article form: the agent community
independently reinvented durable execution. Useful for placing the vocabulary of
Ch.2/Ch.3 onto twenty years of prior art.

## Going deeper

- **[Durable AI Agents: Orchestrating with Fred and Temporal](https://fredk8.dev/blog/durable-ai-agents-orchestrating-the-future-with-fred-and-temporal/)** — LangGraph agents on Temporal execution; a concrete graph-plus-durability composition, with HITL checkpoints.
- **[Durable Execution for AI Agents: State, Retries, Pauses](https://quellixlabs.com/insights/durable-execution-long-running-ai-agent-workflows)** — the "when is this worth it" analysis. Not every agent needs event sourcing, and this one says when it doesn't.
- **[Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)**, artifact management — the filesystem-as-durable-state view, which is the lightweight alternative to a workflow engine and the right first answer for most teams.

## Key concepts

- **Stateless reducer** — `(state, event) → state`; the agent holds nothing across calls.
- **Event sourcing** — the append-only log is the state; current state is a fold over it.
- **Replay determinism** — replay only reconstructs state if the code is deterministic given the log. Constrains what may go in a workflow function (no ambient clocks, no unlogged randomness, no unrecorded I/O).
- **Checkpoint vs. event log** — snapshot the state, or replay the history. Different recovery, storage, and debugging properties; the log gives you rewind.
- **Rewind / time travel** — re-run from a past state with a modification. The best debugging affordance in the field.
- **Idempotency** — a retried effect must not double-apply. Idempotency keys on every external side effect, or you will send the email twice.
- **Exactly-once effects** — unachievable in general; approximated by at-least-once delivery plus idempotent handlers.
- **Execution state vs. business state** — keep unified (#5) or accept drift.
- **Human-in-the-loop as a durable wait** — approval is a wait that may last days. It's the same primitive as any other wait, and #7's "human as a tool" is how it composes.
- **Thread / session identity** — the key that lets a resumed process find its own history.

## Build this

Make the Ch.2/Ch.4 loop crash-proof.

1. Restructure the loop as a reducer: no in-memory state between iterations. All
   state in an append-only JSONL event log plus a working directory.
2. On start, rebuild state by folding the log. On every iteration, append before
   acting.
3. `kill -9` it mid-task. Restart. It must continue, not restart.
4. Add idempotency: give every side-effecting tool call a key derived from the
   event, and make the handler a no-op on a repeat. Test by killing it *between*
   the effect and the log append — the hard case, and the reason ordering matters.
5. Add pause/resume: a `pause` that exits cleanly on an approval-required event,
   and a `resume` that takes the human's answer as an event.
6. Implement rewind: replay to event *n*, change one thing, continue.

Step 4 will take longer than the rest combined. That is the lesson.

## Check yourself

1. Where exactly should the log append happen — before or after the side effect — and what does each choice cost you?
2. Why must a replayed workflow function be deterministic? Name three ordinary things that break it.
3. Checkpoint vs. event log: which gives rewind, and why?
4. Your agent sends a Slack message, then crashes before logging it. Walk through the recovery under (a) at-least-once + idempotency keys, (b) checkpointing.
5. What does "unify execution state and business state" prevent? Describe the drift concretely.
6. When is a full durable-execution engine over-engineering, and what's the right lighter answer?
7. HITL approval that may take three days: what must be true of your harness for that to be ordinary rather than exceptional?
8. Temporal and LangGraph each argue the other's approach is wrong for agents. State each case in one sentence, then say which is right *for your workload* and what fact would change your answer.
