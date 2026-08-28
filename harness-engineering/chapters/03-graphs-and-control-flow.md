# Chapter 3 — Graphs, control flow & orchestration topologies

> **Core question:** For each decision your system makes, who decides — your code
> or the model? That single question, asked per decision rather than per system,
> is the whole of control-flow design.

## The problem

Chapter 2's loop has exactly one topology: one agent, one context, one sequence.
Long-horizon work does not fit in it. Real tasks branch, run in parallel, revisit
earlier decisions, and need different capabilities at different stages. The moment
you admit that, you are designing a **graph**, and the design questions become:
what are the nodes, what carries state along the edges, which edges are chosen by
code and which by the model, and — the one that separates agent graphs from every
DAG you have built before — **where are the cycles?**

The DAG assumption is the trap. Pipelines, build systems, and Airflow are acyclic
by construction. Agentic work is not: retry, revise-after-review, and
reason–act–observe are all cycles. A framework that cannot express a cycle cannot
express an agent, and the workarounds are worse than the cycle.

## Core reading

**1. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** — Anthropic, the patterns section · ~25 min, close read
The five composable patterns. Learn them as a vocabulary you can say out loud:
- **Prompt chaining** — decompose into fixed steps, gate between them.
- **Routing** — classify, then dispatch to a specialist. The cheapest way to get specialization without multi-agent complexity.
- **Parallelization** — *sectioning* (independent subtasks) and *voting* (same task, multiple times, aggregate). Two different reasons to fan out; conflating them is a common design error.
- **Orchestrator–workers** — a lead decomposes dynamically and delegates. The subtasks are not known up front; that is what distinguishes it from sectioning.
- **Evaluator–optimizer** — generate, critique, revise. The verification loop of Ch.2 given a topology.

Then the discipline: these compose, and you should reach for the simplest one that
works. Most systems that "need multi-agent" need routing.

**2. [Graph API overview](https://docs.langchain.com/oss/python/langgraph/graph-api)** — LangGraph docs · ~40 min, with the editor open
The reference implementation of agents-as-state-machines, and worth reading even
if you will never use LangGraph, because it makes the abstractions concrete.
Three parts: **State** (a typed structure carrying everything the agent needs),
**Nodes** (functions encoding logic), **Edges** (functions deciding what runs next).
Pay attention to two things:
- **Reducers.** State updates are annotated with reducers, so concurrent nodes merge deterministically instead of clobbering. This is the part people skip and then debug for a week.
- **`Command`.** A tool can return both a state update and a `goto`, letting a tool participate in routing. It's an elegant hole through the code/model control-flow boundary — and a good thing to be suspicious of.

The framing to keep: cycles, controllability, and persistence are the stated
reasons this exists rather than a DAG runner.

**3. [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)** — factors #8 and #10 · ~15 min
**#8 Own your control flow** is the counterweight to the reading above. Horthy's
position is that a graph framework is often a heavier abstraction than the problem
needs, and that most reliable systems are ordinary software with LLM calls at
chosen points. Read #8 against the LangGraph docs and decide what you actually
believe; this is the live disagreement in the field, and having a position on it
is the point of the chapter.

**4. [Building LangGraph: designing an agent runtime from first principles](https://www.langchain.com/blog/building-langgraph)** — LangChain · ~30 min
Read this immediately after #3, because it is the strongest available answer to
it. The argument starts from three properties of LLM agents — latency (slow,
many calls), unreliability (long runs fail, and naive retry is expensive), and
non-determinism (needs oversight and tracing) — and derives six things a runtime
must therefore provide: parallelization, streaming, task queuing, checkpointing,
human-in-the-loop, and tracing. The claim is that you will build all six
eventually, and that building them badly, one at a time, is worse than adopting
them.

It also disposes of both neighbours directly: **DAG frameworks** can't express the
agent loop at all, and **durable execution engines** like Temporal were designed
before LLM agents — no streaming, latency between steps, and degradation as agent
histories grow. Hold that thought until Ch.6, which reads the same comparison from
Temporal's side.

The concession is the most credible part, and it is Horthy's point conceded:
*"the biggest competitor to any code framework is always no framework."*
Read #3 and #4 as a genuine disagreement between serious people, not as a
vendor pitch and its rebuttal.

**5. [Deep Agents overview](https://docs.langchain.com/oss/python/deepagents/overview)** — LangChain · ~20 min
A worked opinionated topology for long-horizon work: planning tools, virtual
filesystem, sub-agent delegation, context engineering, persistent memory, skills,
sandboxed execution, human-in-the-loop. Read it as an *assembled* system — this
is what Ch.1's parts list looks like once someone has committed to a shape.

**6. [Building a multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)** — Anthropic · ~30 min
Orchestrator–workers at production scale, with the costs stated honestly:
token multiplication, coordination overhead, and the difficulty of getting a lead
agent to write good subagent instructions. The most useful section is where
multi-agent *doesn't* pay: tasks with tight interdependencies between subtasks.

## Going deeper

- **[LangGraph State: Checkpoints, Threads, and Recovery](https://eastondev.com/blog/en/posts/ai/20260424-langgraph-agent-architecture/)** — where the graph meets durability; the bridge to Ch.6.
- **[Deep Dive: 12 Reusable Agentic Harness Design Patterns from Claude Code](https://www.epsilla.com/blogs/2026-04-18-deep-dive-12-reusable-agentic-harness-design-patte)** — patterns reverse-engineered from a shipping harness. Third-party inference, so read it as a hypothesis; the blast-radius/HITL pattern is the one worth stealing.
- **[Temporal: Beyond State Machines for Reliable Distributed Applications](https://temporal.io/blog/temporal-replaces-state-machines-for-distributed-applications)** — the distributed-systems tradition's answer to the same problem, from twenty years earlier. Read it now for the argument that hand-rolled state machines rot; read it again in Ch.6 for the mechanism.

## A note on protocols: when the graph spans organizations

Everything above assumes one team owns every node. When nodes are agents built by
different teams or vendors, the edges become a wire protocol, and a second family
of standards applies — distinct from MCP, which connects an agent to its *tools*
(Ch.5), not to other agents.

- **[Agent2Agent (A2A)](https://a2a-protocol.org/latest/)** — reached v1.0 in 2026, governed under the Linux Foundation. Agents publish **Agent Cards** describing capabilities and how to invoke them securely; communication is asynchronous over HTTP and SSE, so a long-running task doesn't block the caller. Note how much of its design is forced by the same problems as Ch.6: long tasks, callbacks over blocking, and traceability for audit. ([announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/))
- **[A survey of agent interoperability protocols: MCP, ACP, A2A, ANP](https://arxiv.org/abs/2505.02279)** — the comparative map. Read it before adopting any of them.
- **[Governance Gaps in Agent Interoperability Protocols: what MCP, A2A and ACP cannot express](https://arxiv.org/abs/2606.31498)** — the critical read, and the more useful one. What these protocols *cannot* say is where your design work will be.

Treat this as orientation, not a mandate. Cross-organization agent interop is a
real problem for a small number of systems and a premature abstraction for most;
if one team owns every node, a function call is a better edge than a protocol.

## Key concepts

- **Node / edge / state** — the three primitives. If you can name them for your system, you have a graph whether or not you drew one.
- **Static vs. dynamic edges** — code decides, or the model decides. The single most consequential per-decision choice in the system.
- **Reducer** — the merge function for concurrent state writes. Without one, parallelism is a data race with extra steps.
- **Cycle** — retry, revise, reason–act–observe. The reason DAG runners don't fit.
- **Sectioning vs. voting** — parallelism for coverage vs. parallelism for confidence.
- **Orchestrator–workers** — dynamic decomposition; distinguished from sectioning by the subtasks not being known in advance.
- **Evaluator–optimizer** — a cycle with a grader in it.
- **Context isolation as a topology decision** — every subagent boundary is also a context boundary (Ch.4). Topology and context policy are the same decision viewed twice.
- **Token multiplication** — a fan-out of *n* costs roughly *n* times the tokens plus coordination. The reason "just add agents" is not free.

## Build this

Take one real long-horizon task you care about — a dependency upgrade across a
repo, a literature sweep, a data migration.

1. Draw it as a graph. Label every edge **static** (your code decides) or
   **dynamic** (the model decides), and defend each dynamic edge: what would you
   have to enumerate to make it static, and why is that infeasible?
2. Mark the cycles. For each, name its exit condition — this is Ch.2's stopping
   condition, per-cycle.
3. Identify where two nodes could run concurrently and write the reducer for their
   shared state.
4. Now do the "own your control flow" exercise: rewrite the graph as plain code
   with the model called at specific points. Which version is easier to test?
   Easier to change? Be honest — the answer is often not the graph.

[`reference-harness/`](../reference-harness/) works this seam. `route()` makes one
edge static — continuing a sequential scan, where the next file is arithmetic —
and defers everything else to the model:

```sh
SCRIPT=long node harness.ts              # every edge dynamic:  20 model calls, 3,935 tokens
ROUTER=on SCRIPT=long node harness.ts    # one static edge:      1 model call,      92 tokens
```

Identical work; `verify.sh` asserts both runs touch the same files. **Read the
caveat in its README before quoting that number** — a sequential scan is the most
routable thing an agent does, and 97% is not what your workload will give you.
What transfers is the question, not the multiple: for each edge, what would you
have to enumerate to make it static? Where the answer is short, write the code.

## Check yourself

1. Give a task where routing is sufficient and multi-agent is over-engineering. What is the tell?
2. Why can't a DAG runner express an agent? Name the cycle it can't hold.
3. Sectioning and voting both fan out. Describe a task where you need *both*, and how the results combine differently.
4. Concurrent nodes write to a shared `messages` field. What does the reducer need to guarantee, and what breaks without it?
5. What does `Command`-style routing-from-a-tool cost you in testability?
6. Anthropic reports multi-agent underperforming on tightly interdependent subtasks. Explain the mechanism — what specifically goes wrong at the subagent boundary?
7. State a rule of thumb for when a graph framework earns its complexity over plain code.
8. LangGraph derives six required runtime features from three properties of agents. Which of the six would you genuinely build yourself, and which would you rather not? Does that answer settle the disagreement for your case?
