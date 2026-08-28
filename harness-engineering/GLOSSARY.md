# Glossary

The field's vocabulary is unsettled — the same word does different work in
different sources. These are the definitions *this curriculum* uses. Where a
source disagrees, the chapter says so.

## The object

**Harness** — the system surrounding a base model that orchestrates execution and
decides how the model thinks and plans, calls tools and acts, perceives and
manages context, stores artifacts, and evaluates results. (Weng's definition,
adopted here.) Ch.1

**Scaffold** — used interchangeably with harness by most sources. Where a
distinction is drawn, "scaffold" leans toward the static setup (docs, rules,
repo structure) and "harness" toward the runtime. Ch.1

**Agent** — a system where the model directs its own process at runtime, choosing
its next step from environment feedback. Contrast **workflow**: LLM and tool calls
orchestrated through code paths you wrote. The line is a dial, not a switch, and
is set per decision rather than per system. Ch.1, Ch.3

**Long-horizon task** — work exceeding one context window, one process lifetime, or
one human sitting. The three exceedances map to Ch.4, Ch.6, and Ch.9 respectively.

**Model–harness–environment system** — the correct unit of analysis for
reliability. A benchmark varying only the model measures one third of it. Ch.1

**Cybernetic governor** — Fowler's framing: feedforward guides (specs, docs,
prompts) plus feedback sensors (tests, linters, graders) forming a control loop
around the model. Ch.1

## Loops and control flow

**Agent loop / ReAct loop** — think, act, observe, repeat. Ch.2

**Stopping condition** — the predicate that ends a loop. Kinds: goal-satisfied,
budget-exhausted (steps/tokens/time/money), no-progress-detected, human-halt. Ch.2

**Progress detection** — distinguishing work from thrashing. Repeated identical
calls, oscillating edits, a plateaued verification score. Ch.2

**Error compaction** — turning a failure into the smallest context that improves
the next iteration. Never the raw dump, never nothing. Ch.2

**Loop stack** — agent loop → verification loop → event-driven loop → hill-climbing
loop. Outer loops are slower, costlier, and permitted to modify inner ones. Ch.2, Ch.8

**Headless runtime** — the loop decoupled from any UI, so cron, webhook, and human
terminal are all just callers. Ch.2

**Node / edge / state** — the three graph primitives. Every agent system has them
whether or not anyone drew the graph. Ch.3

**Static vs. dynamic edge** — your code decides the next step, or the model does.
The most consequential per-decision choice in a harness. Ch.3

**Reducer** — the merge function for concurrent writes to shared state. Without
one, parallelism is a data race. Ch.3

**Sectioning vs. voting** — fan out for coverage (independent subtasks) vs. fan out
for confidence (same task, aggregate). Different reasons, different aggregation. Ch.3

**Orchestrator–workers** — a lead decomposes *dynamically* and delegates.
Distinguished from sectioning by subtasks not being known in advance. Ch.3

**Evaluator–optimizer** — generate, critique, revise. A cycle with a grader in it. Ch.3

**Token multiplication** — a fan-out of *n* costs ≈ *n*× tokens plus coordination.
Why "just add agents" is not free. Ch.3

## Context and memory

**Context engineering** — curating what occupies the window at each step. A policy
over time; prompt engineering is a string. Ch.4

**Attention budget** — usable attention, smaller than the advertised window. Ch.4

**Context rot** — retrieval accuracy degrading as the window fills, well before
the limit. Ch.4

**Compaction** — lossy summarize-and-restart near the limit. Ch.4

**Retention contract** — the explicit list of what compaction must never drop
(goal, constraints, decisions, failed approaches). A spec. Compaction without one
is amnesia. Ch.4

**Structured note-taking** — externalized memory the agent writes and re-reads
(`NOTES.md`, a to-do list). Ch.4

**Just-in-time retrieval** — hold references, fetch content at runtime. The path,
not the file. Ch.4

**Tool clearing** — evicting stale tool results from the window. Ch.4

**Isolated vs. forked subagent** — clean context window vs. inherited parent
conversation. Isolated subagents lose implicit context; forked ones inherit rot. Ch.4

**Context as cache, filesystem as truth** — durable state belongs in files. The
inversion most context problems reduce to. Ch.4, Ch.6

## Tools and protocols

**Tool as contract** — deterministic implementation, non-deterministic caller,
natural-language specification. A new software paradigm, not an API. Ch.5

**Description engineering** — the tool description is a prompt loaded every turn;
optimize it with evals. Most tool bugs are documentation bugs. Ch.5

**Fixed context cost** — tool definitions are billed on every request, before any
work happens. Ch.5

**Search over listing** — return the relevant subset, not the corpus. Ch.5

**Errors as prompts** — every error message should name the recovery path. Ch.5

**MCP (Model Context Protocol)** — client/server standard for exposing tools and
data. **Host** coordinates clients, supervises lifecycles, and enforces consent;
**Client** manages sessions; **Server** provides tools as an independent process. Ch.5

**Roots** — client-declared directory/URI boundaries a server may access. A
*coordination* mechanism, **not** a security control. Ch.5, Ch.9

**Skill** — instructions loaded on demand. **Progressive disclosure**: a short
always-loaded description, detail pulled in only when relevant. Ch.5

## State and durability

**Stateless reducer** — `(state, event) → state`. The agent holds nothing between
calls. Ch.6

**Event sourcing** — the append-only log *is* the state; current state is a fold
over it. Ch.6

**Replay determinism** — replay reconstructs state only if the code is
deterministic given the log. Rules out ambient clocks, unlogged randomness,
unrecorded I/O. Ch.6

**Checkpoint vs. event log** — snapshot vs. history. Only the log gives rewind. Ch.6

**Rewind / time travel** — re-run from a past state with one thing changed. The
best debugging affordance in the field. Ch.6

**Idempotency** — a retried effect must not double-apply. Keys on every external
side effect. Ch.6

**Execution state vs. business state** — where the loop is, vs. what the task
knows. Unify them or they drift unrecoverably. Ch.6

**Durable wait** — a pause that survives process death. Human approval is one. Ch.6

## Verification

**Verification vs. evaluation** — in-loop, changes behavior now; offline, changes
the harness later. Ch.8

**Deterministic verification** — compiler, tests, linters, schema validation.
Cheapest, most legible, always preferred where available. Ch.8

**LLM-as-a-judge** — for what cannot be checked mechanically. Needs its own eval,
and drifts. Never the first choice. Ch.8

**Rubric** — the explicit criteria a verification loop checks. Writing it is most
of the work. Ch.8

**Trace / span** — the execution tree; spans nest and carry inputs, outputs,
latency, cost. Ch.8

**OTel GenAI semantic conventions** — the portability standard for agent traces. Ch.8

**Online vs. offline eval** — live scoring on production traces vs. a fixed dataset. Ch.8

**Regression suite** — the tasks that must keep passing; what makes harness changes
safe to ship. Ch.8

**Hill climbing** — reading traces to change the harness, systematically. Ch.8

**Verification theater** — checks producing a green signal without evidence of
correctness. The dominant failure mode of enthusiastic eval adoption. Ch.8

## Cost and caching

**Prompt cache** — a discounted rate for a prefix the provider has already
processed. Requires an exact, stable prefix. Ch.7

**Cache breakpoint** — the boundary between the cached prefix and the volatile
remainder. Where you put it is the central cost decision. Ch.7

**Prefix stability** — the property every cache depends on, and the one every
Ch.4 technique threatens. Ch.7

**The compaction/cache tension** — compaction saves tokens now and forfeits the
discount on everything after it. Sometimes correct, never free, rarely measured. Ch.7

**Cache-first layout** — static content first, dynamic content last; the context
layout falls out of the cache rather than the other way around. Ch.7

**Model routing** — cheapest capable model per step. Largest single cost lever,
with real quality risk. Ch.7

**Soft and hard budget** — alert threshold and hard stop. Ch.2's budget stopping
condition denominated in money. Ch.7

**Cost per successful task** — the only cost metric that matters; cost per token
rewards an agent that fails cheaply. Ch.7

## Long-running operations and the human interface

**Context anxiety** — losing coherence as the window fills and wrapping up
prematurely. A stopping-condition bug, not a capability limit. Ch.10

**Context reset** — clear the window entirely and restart from a handoff
artifact, rather than compacting in place. The live disagreement with Ch.4. Ch.10

**Handoff artifact** — the structured document carrying state across a reset, a
crash, or a human absence. If it isn't written down, it doesn't survive. Ch.10

**Plan file / progress file** — externalized intent and status; the minimum
viable handoff artifact. Ch.10

**Generator/evaluator separation** — different agents produce and judge, because
self-grading fails in a predictable direction. Ch.10

**Sprint contract** — agreeing what "done" means before the work, so fail criteria
are enforceable rather than negotiable afterward. Ch.10

**Hard fail threshold** — a gate, not a score. Ch.10

**Refusal to stop early** — an explicit "really done?" check in a fresh context. Ch.10

**Non-blocking supervision** — steering without interrupting the rollout. Ch.10

**Escalation logic** — what the agent must ask about versus decide alone; decides
whether the human is a bottleneck or a backstop. Ch.10

**Harness complexity as a function of model capability** — scaffolding a better
model makes unnecessary. Re-litigate it; don't keep it out of sentiment. Ch.10

## Security

**Blast radius** — the worst outcome of a single action. The right unit for sizing
approval gates. Ch.9

**Prompt injection** — instructions arriving as data. Structural, not patchable;
contain it architecturally. Ch.9

**Lethal trifecta** — private data access + untrusted content + external
communication. All three is exfiltration waiting to happen. Ch.9

**Confused deputy** — the agent acting with its own privileges for a caller who
lacks them. Ch.9

**Token exchange at trust boundaries** — never forward an upstream token
downstream; exchange for one scoped to the next hop. Ch.9

**Allow-list over deny-list** — for network egress and commands alike. Ch.9

**Gateway / broker** — an interception point for inspection, redaction, and
response sanitization. The only control that addresses injection at ingestion. Ch.9

**Human-in-the-loop gate** — approval sized to blast radius, implemented as a tool
call resolving to a durable wait. Ch.6, Ch.9

## Implementation

**Schema-as-three-things** — one Zod schema serves as runtime validator, static
type, and the JSON Schema the model sees. Ch.11

**Object-root constraint** — providers require `type: "object"` at a tool schema's
root; unions must be wrapped. Ch.11

**Parse, don't cast** — every model output is untrusted input at an erased-type
boundary. Ch.11

**Typestate** — state encoded in the type, so illegal transitions fail to compile.
Awkward for dynamic state. Ch.12

**Schema derivation** — generate the model-facing JSON Schema from the
implementation's types so contract and code cannot drift. Ch.12

**The right seam** — Rust for MCP servers, sandboxes, gateways, brokers;
faster-iterating languages for prompts, tools, and evals. Ch.12
