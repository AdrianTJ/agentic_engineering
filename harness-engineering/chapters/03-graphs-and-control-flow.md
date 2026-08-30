# Chapter 3 — Graphs, control flow & orchestration topologies

> **Core question:** For each decision your system makes, who decides: your code
> or the model? That single question, asked per decision rather than per system,
> is the whole of control-flow design.

## The problem

Chapter 2's loop has exactly one topology, which is one agent, one context, and
one sequence. Long-horizon work does not fit inside it. Real tasks branch, run
in parallel, revisit earlier decisions, and need different capabilities at
different stages. The moment you admit any of that, you are designing a graph,
and the design questions follow: what are the nodes, what carries state along
the edges, and which edges are chosen by code as opposed to the model. There is
also the question that separates agent graphs from every DAG you have built
before, which is where the cycles are.

The DAG assumption is the trap here. Pipelines, build systems, and Airflow are
acyclic by construction, and agentic work is not. Retry is a cycle,
revise-after-review is a cycle, and the reason-act-observe loop is a cycle. A
framework that cannot express a cycle cannot express an agent, and the
workarounds are worse than the cycle would have been.

## Core reading

**1. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** — Anthropic, the patterns section · ~25 min, close read
This gives you the five composable patterns, and they are worth learning as a
vocabulary you can say out loud. Prompt chaining decomposes work into fixed
steps with gates between them. Routing classifies a request and dispatches it
to a specialist, which is the cheapest way to get specialization without
multi-agent complexity. Parallelization comes in two forms, sectioning for
independent subtasks and voting for running the same task several times and
aggregating; these are different reasons to fan out, and conflating them is a
common design error. Orchestrator-workers has a lead agent decompose the work
dynamically and delegate it, and what distinguishes it from sectioning is that
the subtasks are not known up front. Evaluator-optimizer, finally, is generate,
critique, and revise, which is Chapter 2's verification loop given a topology.

Then comes the discipline. These patterns compose, and you should reach for the
simplest one that works. Most systems that appear to need multi-agent
architecture actually need routing.

**2. [Graph API overview](https://docs.langchain.com/oss/python/langgraph/graph-api)** — LangGraph docs · ~40 min, with the editor open
This is the reference implementation of agents as state machines, and it is
worth reading even if you never intend to use LangGraph, because it makes the
abstractions concrete. There are three parts: state, a typed structure carrying
everything the agent needs; nodes, which are functions encoding logic; and
edges, which are functions deciding what runs next.

Two details deserve close attention. The first is reducers. State updates are
annotated with reducers so that concurrent nodes merge deterministically
instead of clobbering each other, and this is the part people skip and then
debug for a week. The second is `Command`, which lets a tool return both a
state update and a `goto`, so a tool can participate in routing. It is an
elegant hole through the boundary between code-driven and model-driven control
flow, and a good thing to be suspicious of.

The framing to keep from the piece is that cycles, controllability, and
persistence are the stated reasons this exists instead of a DAG runner.

**3. [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)** — factors #8 and #10 · ~15 min
Factor 8, own your control flow, is the counterweight to the reading above.
Horthy's position is that a graph framework is often a heavier abstraction than
the problem needs, and that most reliable systems are ordinary software with
model calls at chosen points. Read factor 8 against the LangGraph docs and
decide what you actually believe. This is the live disagreement in the field,
and forming a position on it is the point of the chapter.

**4. [Building LangGraph: designing an agent runtime from first principles](https://www.langchain.com/blog/building-langgraph)** — LangChain · ~30 min
Read this immediately after the previous entry, because it is the strongest
available answer to it. The argument starts from three properties of agents:
they are slow and make many calls, long runs fail often enough that naive retry
is expensive, and their non-determinism demands oversight and tracing. From
those three it derives six things a runtime must provide, namely
parallelization, streaming, task queuing, checkpointing, human-in-the-loop, and
tracing. The claim is that you will eventually build all six, and that building
them badly, one at a time, is worse than adopting them.

The piece also disposes of both neighbours directly. DAG frameworks cannot
express the agent loop at all, and durable execution engines like Temporal were
designed before agents existed, so they lack streaming, add latency between
steps, and degrade as agent histories grow. Hold that thought until Chapter 6,
which reads the same comparison from Temporal's side.

The concession is the most credible part, and it concedes Horthy's point in so
many words: *"the biggest competitor to any code framework is always no
framework."* Read the two pieces as a genuine disagreement between serious
people rather than as a vendor pitch and its rebuttal.

**5. [Deep Agents overview](https://docs.langchain.com/oss/python/deepagents/overview)** — LangChain · ~20 min
This is a worked, opinionated topology for long-horizon work, with planning
tools, a virtual filesystem, sub-agent delegation, context engineering,
persistent memory, skills, sandboxed execution, and human-in-the-loop support.
Read it as an assembled system. This is what Chapter 1's parts list looks like
once someone has committed to a shape.

**6. [Building a multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)** — Anthropic · ~30 min
This is orchestrator-workers at production scale, and it states the costs
plainly: token multiplication, coordination overhead, and the difficulty of
getting a lead agent to write good subagent instructions. The most useful
section covers where multi-agent architecture does not pay, which is tasks with
tight interdependencies between subtasks.

## Going deeper

- **[LangGraph State: Checkpoints, Threads, and Recovery](https://eastondev.com/blog/en/posts/ai/20260424-langgraph-agent-architecture/)** is where the graph meets durability, and the bridge to Chapter 6.
- **[Deep Dive: 12 Reusable Agentic Harness Design Patterns from Claude Code](https://www.epsilla.com/blogs/2026-04-18-deep-dive-12-reusable-agentic-harness-design-patte)** collects patterns reverse-engineered from a shipping harness. It is third-party inference, so read it as a hypothesis; the blast-radius and human-in-the-loop pattern is the one worth stealing.
- **[Temporal: Beyond State Machines for Reliable Distributed Applications](https://temporal.io/blog/temporal-replaces-state-machines-for-distributed-applications)** is the distributed-systems tradition's answer to the same problem, from twenty years earlier. Read it now for the argument that hand-rolled state machines rot, and again in Chapter 6 for the mechanism.

## A note on protocols: when the graph spans organizations

Everything above assumes one team owns every node. When the nodes are agents
built by different teams or vendors, the edges become a wire protocol, and a
second family of standards applies. These are distinct from MCP, which connects
an agent to its tools (Chapter 5) rather than to other agents.

- **[Agent2Agent (A2A)](https://a2a-protocol.org/latest/)** reached v1.0 in 2026 and is governed under the Linux Foundation. Agents publish Agent Cards describing their capabilities and how to invoke them securely, and communication is asynchronous over HTTP and SSE so that a long-running task does not block the caller. Notice how much of the design is forced by the same problems as Chapter 6: long tasks, callbacks instead of blocking, and traceability for audit. The [announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) has the background.
- **[A survey of agent interoperability protocols: MCP, ACP, A2A, ANP](https://arxiv.org/abs/2505.02279)** is the comparative map, and worth reading before adopting any of them.
- **[Governance Gaps in Agent Interoperability Protocols: what MCP, A2A and ACP cannot express](https://arxiv.org/abs/2606.31498)** is the critical read, and the more useful one. What these protocols cannot say is where your design work will be.

Treat this section as orientation rather than a mandate. Cross-organization
agent interop is a real problem for a small number of systems and a premature
abstraction for most. If one team owns every node, a function call is a better
edge than a protocol.

## Key concepts

**Node, edge, state.** The three primitives. If you can name them for your
system, you have a graph, whether or not anyone drew one.

**Static versus dynamic edges.** Either code decides what runs next, or the
model does. This is the single most consequential per-decision choice in the
system.

**Reducer.** The merge function for concurrent writes to shared state. Without
one, parallelism is a data race with extra steps.

**Cycle.** Retry, revise, and reason-act-observe are all cycles, and they are
the reason DAG runners do not fit.

**Sectioning versus voting.** Parallelism for coverage as against parallelism
for confidence. The results also combine differently.

**Orchestrator-workers.** Dynamic decomposition by a lead agent. What
distinguishes it from sectioning is that the subtasks are not known in advance.

**Evaluator-optimizer.** A cycle with a grader in it.

**Context isolation as a topology decision.** Every subagent boundary is also a
context boundary, in Chapter 4's sense. Topology and context policy are the
same decision viewed from two sides.

**Token multiplication.** A fan-out of *n* costs roughly *n* times the tokens,
plus coordination overhead, which is why adding agents is never free.

## Build this

Take one real long-horizon task you care about, such as a dependency upgrade
across a repository, a literature sweep, or a data migration.

1. Draw it as a graph. Label every edge static, meaning your code decides, or
   dynamic, meaning the model decides, and defend each dynamic edge. What would
   you have to enumerate to make it static, and why is that infeasible?
2. Mark the cycles. For each one, name its exit condition, which is Chapter 2's
   stopping condition applied per cycle.
3. Identify where two nodes could run concurrently, and write the reducer for
   their shared state.
4. Then run the own-your-control-flow exercise. Rewrite the graph as plain code
   with the model called at specific points, and ask which version is easier to
   test and easier to change. Answer truthfully, because the answer is often
   not the graph.

[`reference-harness/`](../reference-harness/) works this seam. Its `route()`
function makes one edge static, namely continuing a sequential scan, where the
next file is arithmetic, and it defers everything else to the model:

```sh
SCRIPT=long node harness.ts              # every edge dynamic:  20 model calls, 4,265 tokens
ROUTER=on SCRIPT=long node harness.ts    # one static edge:      1 model call,     110 tokens
```

The work is identical, and `verify.sh` asserts that both runs touch the same
files. Read the caveat in its README before quoting those numbers anywhere,
because a sequential scan is the most routable thing an agent ever does, and a
97 percent saving is not what your workload will give you. What transfers is
the question rather than the multiple. For each edge, ask what you would have
to enumerate to make it static, and where the answer is short, write the code.

## Check yourself

1. Give a task where routing is sufficient and multi-agent architecture is over-engineering. What is the tell?
2. Why can a DAG runner not express an agent? Name the cycle it cannot hold.
3. Sectioning and voting both fan out. Describe a task that needs both, and how the results combine differently in each.
4. Concurrent nodes write to a shared `messages` field. What does the reducer need to guarantee, and what breaks without it?
5. What does `Command`-style routing from inside a tool cost you in testability?
6. Anthropic reports multi-agent systems underperforming on tightly interdependent subtasks. Explain the mechanism. What goes wrong at the subagent boundary, specifically?
7. State a rule of thumb for when a graph framework earns its complexity over plain code.
8. LangGraph derives six required runtime features from three properties of agents. Which of the six would you genuinely build yourself, and which would you rather not? Does that answer settle the disagreement for your case?
