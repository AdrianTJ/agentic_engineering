# Chapter 11 — TypeScript harness engineering

> **Core question:** Chapters 1 through 10 are language-agnostic. What does
> TypeScript specifically give you, what does it specifically cost you, and
> where does its type system stop being load-bearing?

## The problem

TypeScript is where most agent harnesses actually get built. The model SDKs are
first-class, the MCP tooling is mature, and the schema story is unusually good,
since one Zod schema serves at once as the runtime validator, the static type,
and the JSON Schema the model sees. That three-in-one is the language's real
advantage for this domain, and it lands exactly on Chapter 5's central problem.

The costs are equally specific. TypeScript's types are erased, so nothing is
checked at the boundary unless you check it, and every input in an agent system
crosses a boundary from a non-deterministic producer. Long-running Node
processes have to be treated as disposable, in Chapter 6's sense, because they
are. And structured concurrency is not something the language gives you;
parallel tool calls, timeouts, and cancellation are all manual, which is
Chapter 3's territory.

This chapter assumes Chapters 1 through 10 and the vocabulary they establish.

## Core reading

**1. [Agent SDK reference — TypeScript](https://code.claude.com/docs/en/sdk/sdk-typescript)** — Claude Agent SDK · ~50 min, with an editor
This is the most complete production harness whose API you can read, and it
maps one to one onto this curriculum. Work through it as a checklist. The
choice between `query()` and a stateful client is Chapter 6's stateless-reducer
question made into an API decision. The three tool layers, meaning built-in
tools, custom in-process tools, and external MCP servers, carry three different
context-cost and trust profiles, in the sense of Chapters 5 and 9. The `tool()`
helper with Zod supplies a name, a description, an input schema, and an
implementation, which is Chapter 5's contract, typed. `createSdkMcpServer` is
in-process MCP with no subprocess. `allowedTools` and `permissionMode` are
Chapter 9's permission model as configuration. Hooks are the interception
points for policy, logging, and approval gates. And session management is
Chapter 6's thread identity.

Read the options object closely. It is a compact statement of what a mature
harness has to be configurable about, and it is a better summary of Chapters 5,
6, and 9 than most prose.

Three parts deserve a slower read, because each is a chapter of this curriculum
made concrete.

The first is the six permission modes, from Chapter 9. `default` routes
unmatched tools to your `canUseTool` callback, `dontAsk` denies anything not
pre-approved, `acceptEdits` auto-approves file edits, `bypassPermissions`
approves everything and is for trusted environments only, `plan` explores
without editing, and `auto` uses a model classifier to approve each call.
Notice that this is a blast-radius dial rather than a security boundary, since
every one of these still runs inside whatever sandbox you gave it, which is
Chapter 9's point about Roots restated at the SDK level. `canUseTool` is where
your own blast-radius policy lives.

The second is the hook surface, spanning Chapters 2, 9, and 10. The hooks
include `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`,
`PreCompact`, `SessionStart`, `SessionEnd`, `Stop`, and `SubagentStart` with
`SubagentStop`, among others. These are the interception seams. `PreToolUse` is
where an approval gate goes, `PostToolUseFailure` is where Chapter 2's error
compaction goes, and `PreCompact` is where you enforce Chapter 4's retention
contract before the window is rewritten.

The third is that compaction is observable. A `system/compact_boundary` message
carries the trigger, either `manual` or `auto`, along with `pre_tokens`, which
is Chapter 4's measurement exercise available for free. And `SessionStart`
carries a `source` of `startup`, `resume`, `clear`, `compact`, or `fork`, which
is Chapter 6's thread identity and Chapter 10's context-reset distinction
surfaced in the API. A harness that ignores `source` cannot tell a fresh start
from a resumption.

**2. [Zod — defining schemas](https://zod.dev/api)** and **[basics](https://zod.dev/basics)** · ~35 min
The schema layer that makes everything else typed. Learn `z.infer`,
refinements, transforms, and discriminated unions. One constraint is worth
memorizing, because it will bite you:

> Providers require `"type": "object"` at the root of a tool's input schema.
> `z.union` and `z.discriminatedUnion` do not produce an object root, so a tool
> whose top-level schema is a union will be rejected. Wrap it as
> `z.object({ action: z.discriminatedUnion("kind", [...]) })`.

That is the archetypal TypeScript-harness bug: valid TypeScript, valid Zod, and
an invalid tool. The type system cannot help you, because the constraint lives
in the provider's JSON Schema dialect.

**3. [AI SDK: tools and tool calling](https://github.com/vercel/ai/blob/main/content/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx)** and **[AI SDK 6](https://vercel.com/blog/ai-sdk-6)** — Vercel · ~40 min
The other major TypeScript agent runtime, and worth reading precisely because
it makes different choices. The `tool()` helper takes a description, Zod
parameters, and an `execute` function, and `ToolLoopAgent` is a production
implementation of Chapter 2's loop with structured output at the end. Read it
as a second data point on the same abstractions, because the disagreements
between it and the Claude SDK are the design space.

**4. [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents)** · re-read with code open · ~15 min
Now implement Chapter 5's principles in Zod. A `.describe()` on every field is
description engineering at the parameter level, and a well-described schema is a
prompt. Notice that Zod lets you put the documentation exactly where the model
reads it.

**5. [rust-sdk `rmcp` README](https://github.com/modelcontextprotocol/rust-sdk/blob/main/crates/rmcp/README.md)** — skim, ~10 min
Read the shape of the Rust MCP SDK before Chapter 12, so that the comparison
there lands. If you are only doing the TypeScript track, skip it.

## Going deeper

- **[Structured outputs with the AI SDK](https://www.aihero.dev/structured-outputs-with-vercel-ai-sdk)** covers the generate-object path, and when structured output beats a tool call.
- **[strands-agents/sdk-typescript](https://github.com/strands-agents/sdk-typescript)** is a third runtime, useful for triangulating which abstractions are essential and which are house style.
- **[MLflow tracing](https://mlflow.org/docs/latest/genai/tracing/)** lets you instrument the TypeScript harness per Chapter 8.
- A few Node specifics are each worth a search: `AbortController` for cancellation and timeouts, `AsyncLocalStorage` for trace-context propagation across the loop, worker threads as against child processes for sandboxed execution, and graceful-shutdown handling for Chapter 6's crash tests.

## Key concepts

**Schema as three things.** A Zod schema is at once the runtime validator, the
static type, and the JSON Schema for the model. This is the language's core
advantage here.

**`z.infer`.** Derive the TypeScript type from the schema rather than
hand-writing both.

**The object-root constraint.** Providers need `type: "object"` at the root, so
unions must be wrapped.

**`.describe()` as prompt surface.** Parameter docs go where the model reads
them.

**Type erasure at the boundary.** Parse rather than cast, because every model
output is untrusted input.

**In-process MCP as against subprocess MCP.** No IPC and no isolation, as
against IPC and real isolation, in Chapter 9's sense. It is a security decision
wearing a performance costume.

**Hooks.** The interception seam for permissions, logging, and approval.

**`AbortController`.** The cancellation primitive that Chapter 2's budgets need.

**`AsyncLocalStorage`.** How a trace ID survives an async loop without being
threaded through every call.

**Disposable process.** Assume the Node process dies, and keep state in the
log, in Chapter 6's sense.

## Build this

Port your Chapters 2 through 10 harness to TypeScript, or build it natively.

[`reference-harness/`](../reference-harness/) is already TypeScript, so the
fastest version of this exercise is to take it and replace one function,
`ModelProvider.decide`, with a real SDK call, then re-run `verify.sh` and see
which of its 42 assertions still hold once the model is non-deterministic. The
ones that break are the interesting ones.

1. Schemas first. Define every tool once in Zod, and derive both the TypeScript
   type and the JSON Schema sent to the model, with zero hand-written
   duplicates.
2. Parse at every boundary. Model output, tool results, and config all go
   through `.parse()`. Turn a parse failure into a compacted error the loop can
   act on, in Chapter 2's sense, rather than a crash.
3. Add cancellation. Wire `AbortController` into every tool call, enforce
   Chapter 2's step, token, and wall-clock budgets by aborting, and verify that
   a tool actually stops when aborted.
4. Add trace context. Use `AsyncLocalStorage` so that every span in a run
   carries the run ID without being passed explicitly, and emit OTel spans, in
   Chapter 8's sense.
5. Add permissions. Implement an allow-list and a hook that gates
   high-blast-radius tools behind approval, in Chapter 9's sense.
6. Prove the constraint. Deliberately define a tool with a
   `z.discriminatedUnion` at the root, watch it get rejected, then fix it.
   Write the failure down, because this is the kind of knowledge that only
   comes from hitting it.

## Check yourself

1. Why does a Zod schema at a tool boundary do three jobs at once, and what breaks if you hand-maintain any of the three separately?
2. What exactly fails when a tool's input schema has a union at the root, and where in the stack does the error appear?
3. In-process MCP server as against subprocess: give the case for each, and name the Chapter 9 property you give up by choosing the first.
4. How do you enforce a wall-clock budget on a tool call that ignores cancellation? What is the honest answer?
5. Why is `AsyncLocalStorage` a better fit for trace context than a parameter, and what does it cost in testability?
6. A model returns a tool call whose arguments fail schema validation. Design the recovery: what goes back into context, and what stops an infinite retry?
7. TypeScript cannot type the property that a string is a valid file path inside the sandbox. What does that push into runtime, and which chapter owns it?
