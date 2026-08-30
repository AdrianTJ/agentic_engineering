# Chapter 6 — State, durability, and resumption

> **Core question:** The process died at hour six. What happens now?

## The problem

Chapter 4 kept work alive across a context window. This chapter keeps it alive
across a process. These are different problems, and the second one is older; it
belongs to distributed systems, and the agent community has been rediscovering
its solutions, usually the hard way.

A genuinely long-horizon agent spends much of its life waiting, whether for a
build, for a human approval, for a rate limit, or for tomorrow. Anything that
waits must survive a restart, and anything that survives a restart faces the
classic questions. Where does the state live? Is resumption exactly-once or
at-least-once? Are the effects idempotent? Can you prove, after the fact, what
actually happened?

The agent-specific twist is that the state is unusually awkward. It is part
conversation, part filesystem, and part external side effects already committed
to the world, and you cannot roll back a sent email. Durability design is
largely the work of being precise about which parts of your state are
replayable and which are not.

## Core reading

**1. [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)** — factors #5, #6, #12 · ~30 min
This is the clearest short statement of agent state design, and the three
factors are one idea in three parts. Factor 12, make your agent a stateless
reducer, is the foundation: the agent is a pure function of the form
`(state, event) → state`, the state lives outside it, and everything else
follows. Factor 5 says to unify execution state and business state, because
keeping "where the loop is" in one store and "what the task knows" in another
guarantees they drift, and the drift is unrecoverable. Factor 6 asks for
launch, pause, and resume as simple APIs, since wherever pause and resume are
not first-class operations, human-in-the-loop and long waits end up as hacks.

**2. [Durable Execution meets AI: why Temporal is a good foundation for AI agents](https://temporal.io/blog/durable-execution-meets-ai-why-temporal-is-the-perfect-foundation-for-ai)** — Temporal · ~30 min
Vendor-authored, and still the best available explanation of the pattern. The
mechanism is event sourcing. Record a full event history of every activity call
and its result, so that after a crash the workflow can be replayed
deterministically to exactly where it was. Nothing is checkpointed in the
snapshot sense, because the log is the state. Read past the product to the
model: waits measured in days or weeks are normal, retries are declarative, and
the actual requirement is resuming from a safe point without duplicating
business actions.

**3. [Temporal: Beyond State Machines for Reliable Distributed Applications](https://temporal.io/blog/temporal-replaces-state-machines-for-distributed-applications)** — ~25 min
This makes the argument that hand-rolled state machines rot. Every new state
multiplies the transitions, and the explicit machine drifts away from the real
one. It matters here because Chapter 3's graph is a hand-rolled state machine,
and this is the strongest available critique of it.

**4. [Building LangGraph: designing an agent runtime from first principles](https://www.langchain.com/blog/building-langgraph)** — LangChain · ~15 min, targeted re-read
You read this in Chapter 3 for the control-flow argument. Return to it for the
durability section, which is the direct rebuttal to the two Temporal pieces:
durable execution engines predate agents, and therefore lack streaming, add
latency between steps, and degrade as agent histories grow. LangGraph's own
answer is checkpointing at discrete step boundaries, with state serialized so a
run can resume "on any machine, an arbitrary amount of time after" it was
saved.

One detail is worth stealing regardless of framework. A pause for a human is
the same primitive as a pause for a clock. Checkpointing means an interrupt is
a real interruption, with nothing held running while it waits, so approval
"scales neither in time nor in volume." That property is what makes Chapter
10's human interface affordable, and most hand-rolled harnesses block a process
instead.

**5. [LangGraph State: Checkpoints, Threads, and Recovery](https://eastondev.com/blog/en/posts/ai/20260424-langgraph-agent-architecture/)** · ~25 min
This covers durability inside a graph framework. A checkpointer backed by
SQLite or Postgres makes state persistent, so agents can crash, resume, and
also rewind, meaning re-run from an earlier state with a change applied. Rewind
is the underrated capability of the three, because it turns debugging a
long-horizon agent from archaeology into an experiment.

**6. [Agent Workflows Are Rediscovering Durable Execution](https://medium.com/beyond-localhost/agent-workflows-are-rediscovering-durable-execution-be110661ed8c)** · ~20 min
This is the synthesis, and the chapter's thesis in article form: the agent
community independently reinvented durable execution. It is useful for placing
the vocabulary of Chapters 2 and 3 onto twenty years of prior art.

**7. [Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes](https://arxiv.org/abs/2604.28138)** · ~35 min
This is the empirical case that the chapter is not academic. It measures
recovery correctness, meaning whether the resumed run produced the right result
rather than merely restarting, across three approaches on Terminal-Bench:

| Approach | Recovery correctness |
|---|---|
| Chat history only | **8–13%** |
| Chat + filesystem | 28–42% |
| Semantics-aware C/R (Crab) | **100%** |

Spend a moment on the first row. Preserving the conversation and nothing else,
which is what most harnesses mean by "resumable," recovers correctly roughly
one time in ten. The paper's framing of the two extremes is the useful part:
application-level recovery preserves chat history but misses effects on the
operating system, while full per-turn checkpointing is correct but too
expensive to co-locate densely. Everything interesting lives in between, and
that is why this chapter's exercise is harder than it looks.

## Going deeper

- **[Durable AI Agents: Orchestrating with Fred and Temporal](https://fredk8.dev/blog/durable-ai-agents-orchestrating-the-future-with-fred-and-temporal/)** runs LangGraph agents on Temporal execution, a concrete composition of graph and durability, with human-in-the-loop checkpoints.
- **[Durable Execution for AI Agents: State, Retries, Pauses](https://quellixlabs.com/insights/durable-execution-long-running-ai-agent-workflows)** is the analysis of when the machinery is worth it. Not every agent needs event sourcing, and this piece says when yours does not.
- **[Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)**, in its artifact-management sections, gives the filesystem-as-durable-state view, which is the lightweight alternative to a workflow engine and the right first answer for most teams.

## Key concepts

**Stateless reducer.** `(state, event) → state`, with the agent holding nothing
across calls.

**Event sourcing.** The append-only log is the state, and the current state is
a fold over it.

**Replay determinism.** Replay only reconstructs state if the code is
deterministic given the log, which constrains what may go inside a workflow
function: no ambient clocks, no unlogged randomness, and no unrecorded I/O.

**Checkpoint versus event log.** Snapshot the state, or replay the history. The
two differ in recovery, storage, and debugging properties, and only the log
gives you rewind.

**Rewind, or time travel.** Re-running from a past state with a modification.
The best debugging affordance in the field.

**Idempotency.** A retried effect must not apply twice. Put idempotency keys on
every external side effect, or you will send the email twice.

**Exactly-once effects.** Unachievable in general, and approximated by
at-least-once delivery plus idempotent handlers.

**Execution state versus business state.** Keep them unified, per factor 5, or
accept that they will drift.

**Human-in-the-loop as a durable wait.** An approval is a wait that may last
days. It is the same primitive as any other wait, and factor 7's human-as-a-tool
idea is how it composes.

**Thread or session identity.** The key that lets a resumed process find its
own history.

## Build this

Make the loop from Chapters 2 and 4 crash-proof.

1. Restructure the loop as a reducer, with no in-memory state between
   iterations. All state lives in an append-only JSONL event log plus a working
   directory.
2. On start, rebuild state by folding the log. On every iteration, append
   before acting.
3. `kill -9` the process mid-task, then restart it. It must continue rather
   than start over.
4. Add idempotency. Give every side-effecting tool call a key derived from the
   event, and make the handler a no-op on a repeat. Test it by killing the
   process between the effect and the log append, which is the hard case and
   the reason the ordering matters.
5. Add pause and resume: a pause that exits cleanly on an approval-required
   event, and a resume that takes the human's answer as an event.
6. Implement rewind. Replay to event *n*, change one thing, and continue.

Step 4 will take longer than the rest combined, and that is the lesson.

Then update your Chapter 1 inventory. The filesystem and memory rows are no
longer "none," and you can now say what each one is for.

[`reference-harness/`](../reference-harness/) implements steps 1 through 4, and
its `verify.sh` asserts them, including the check that post-crash side effects
match a clean run byte for byte. Its README documents a bug the first version
shipped: a crash between `tool_requested` and the effect silently dropped the
work, and nothing errored. The log looked healthy while the run reported
success with output missing. Read that account before you write step 4, then
check whether your own implementation has the same hole.

## Check yourself

1. Where exactly should the log append happen, before or after the side effect, and what does each choice cost you?
2. Why must a replayed workflow function be deterministic? Name three ordinary things that break it.
3. Checkpoint versus event log: which one gives you rewind, and why?
4. Your agent sends a Slack message, then crashes before logging it. Walk through the recovery under at-least-once delivery with idempotency keys, and then under checkpointing.
5. What does unifying execution state and business state prevent? Describe the drift concretely.
6. When is a full durable-execution engine over-engineering, and what is the right lighter answer?
7. A human approval may take three days to arrive. What must be true of your harness for that to be ordinary rather than exceptional?
8. Chat-only recovery scores 8 to 13 percent on correctness. Name three things it loses that a conversation cannot hold, and say which of them your harness currently drops.
9. Temporal and LangGraph each argue that the other's approach is wrong for agents. State each case in one sentence, then say which is right for your workload and what fact would change your answer.
