# Chapter 11 — TypeScript harness engineering

> **Core question:** Chapters 1–10 are language-agnostic. What does TypeScript
> specifically give you, what does it specifically cost you, and where does its
> type system stop being load-bearing?

## The problem

TypeScript is where most agent harnesses actually get built: the model SDKs are
first-class, the MCP tooling is mature, and the schema story is unusually good —
one Zod schema is simultaneously the runtime validator, the static type, and the
JSON Schema the model sees. That three-in-one is the language's real advantage
for this domain, and it lands exactly on Chapter 5's central problem.

The costs are equally specific. TypeScript's types are erased, so nothing is
checked at the boundary unless you check it — and every input in an agent system
crosses a boundary from a non-deterministic producer. Long-running Node processes
have to be treated as disposable (Ch.6), because they are. And structured
concurrency is not a thing the language gives you: parallel tool calls, timeouts,
and cancellation are all manual (Ch.3).

Prerequisite: Chapters 1–10. This chapter assumes the vocabulary.

## Core reading

**1. [Agent SDK reference — TypeScript](https://code.claude.com/docs/en/sdk/sdk-typescript)** — Claude Agent SDK · ~50 min, with an editor
The most complete production harness you can read the API of, and it maps
one-to-one onto this curriculum. Work through it as a checklist:
- **`query()` vs. a stateful client** — Ch.6's stateless-reducer question, made an API choice.
- **The three tool layers** — built-in tools, custom in-process tools, external MCP servers. Three different context-cost and trust profiles (Ch.5, Ch.9).
- **`tool()` with Zod** — name, description, input schema, implementation. Chapter 5's contract, typed.
- **`createSdkMcpServer`** — in-process MCP, no subprocess.
- **`allowedTools` / `permissionMode`** — Ch.9's permission model as configuration.
- **Hooks** — interception points for policy, logging, and approval gates.
- **Session management** — Ch.6's thread identity.

Read the options object closely. It is a compact statement of what a mature
harness has to be configurable about, and it is a better summary of Chapters 5, 6,
and 9 than most prose.

Three parts deserve a slower read, because each is a chapter of this curriculum
made concrete:

**The six permission modes** (Ch.9). `default` routes unmatched tools to your
`canUseTool` callback; `dontAsk` denies anything not pre-approved; `acceptEdits`
auto-approves file edits; `bypassPermissions` approves everything (trusted
environments only); `plan` explores without editing; `auto` uses a model
classifier to approve each call. Notice this is a **blast-radius dial, not a
security boundary** — every one of these still runs inside whatever sandbox you
gave it, which is Ch.9's point about Roots restated at the SDK level.
`canUseTool` is where your own blast-radius policy lives.

**The hook surface** (Ch.2, Ch.9, Ch.10). `PreToolUse`, `PostToolUse`,
`PostToolUseFailure`, `PermissionRequest`, `PreCompact`, `SessionStart`,
`SessionEnd`, `Stop`, `SubagentStart`/`SubagentStop`, among others. These are the
interception seams: `PreToolUse` is where an approval gate goes,
`PostToolUseFailure` is where Ch.2's error compaction goes, and `PreCompact` is
where you enforce Ch.4's retention contract *before* the window is rewritten.

**Compaction is observable.** A `system/compact_boundary` message carries the
trigger (`manual` or `auto`) and `pre_tokens` — Ch.4's measurement exercise,
available for free. And `SessionStart` carries a `source` of `startup`, `resume`,
`clear`, `compact`, or `fork`: Ch.6's thread identity and Ch.10's context-reset
distinction, surfaced in the API. A harness that ignores `source` cannot tell a
fresh start from a resumption.

**2. [Zod — defining schemas](https://zod.dev/api)** and **[basics](https://zod.dev/basics)** · ~35 min
The schema layer that makes everything else typed. Learn `z.infer`, refinements,
transforms, and discriminated unions. One constraint is worth memorizing because
it will bite you:

> LLM providers require `"type": "object"` at the root of a tool's input schema.
> `z.union` and `z.discriminatedUnion` do **not** produce an object root, so a
> tool whose top-level schema is a union will be rejected. Wrap it:
> `z.object({ action: z.discriminatedUnion("kind", [...]) })`.

That is the archetypal TypeScript-harness bug: valid TypeScript, valid Zod,
invalid tool. The type system cannot help you, because the constraint lives in
the provider's JSON Schema dialect.

**3. [AI SDK: tools and tool calling](https://github.com/vercel/ai/blob/main/content/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx)** and **[AI SDK 6](https://vercel.com/blog/ai-sdk-6)** — Vercel · ~40 min
The other major TS agent runtime, and worth reading precisely because it makes
different choices. The `tool()` helper — description, Zod parameters, `execute` —
plus `ToolLoopAgent`, a production implementation of Chapter 2's loop with
structured output at the end. Read it as a second data point on the same
abstractions; the disagreements between this and the Claude SDK are the design
space.

**4. [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents)** · re-read with code open · ~15 min
Now implement Chapter 5's principles in Zod. `.describe()` on every field is
description engineering at the parameter level; a well-described schema is a
prompt. Notice that Zod lets you put the documentation exactly where the model
reads it.

**5. [rust-sdk `rmcp` README](https://github.com/modelcontextprotocol/rust-sdk/blob/main/crates/rmcp/README.md)** — skim, ~10 min
Read the *shape* of the Rust MCP SDK before Chapter 12, so the comparison there
lands. If you're only doing the TS track, skip.

## Going deeper

- **[Structured outputs with the AI SDK](https://www.aihero.dev/structured-outputs-with-vercel-ai-sdk)** — the generate-object path, and when structured output beats a tool call.
- **[strands-agents/sdk-typescript](https://github.com/strands-agents/sdk-typescript)** — a third runtime; useful for triangulating which abstractions are essential and which are house style.
- **[MLflow tracing](https://mlflow.org/docs/latest/genai/tracing/)** — instrument the TS harness per Ch.8.
- **Node specifics** worth a search each: `AbortController` for cancellation and timeouts, `AsyncLocalStorage` for trace context propagation across the loop, worker threads vs. child processes for sandboxed execution, and graceful-shutdown handling for Ch.6's crash tests.

## Key concepts

- **Schema-as-three-things** — Zod schema = runtime validator + static type + JSON Schema for the model. The language's core advantage here.
- **`z.infer`** — derive the TS type from the schema, never hand-write both.
- **Object-root constraint** — providers need `type: "object"` at the root; unions must be wrapped.
- **`.describe()` as prompt surface** — parameter docs go where the model reads them.
- **Type erasure at the boundary** — parse, don't cast. Every model output is untrusted input.
- **In-process MCP vs. subprocess MCP** — no IPC and no isolation, versus IPC and real isolation (Ch.9). A security decision wearing a performance costume.
- **Hooks** — the interception seam for permissions, logging, and approval.
- **`AbortController`** — the cancellation primitive Ch.2's budgets need.
- **`AsyncLocalStorage`** — how a trace ID survives an async loop without threading it through every call.
- **Disposable process** — assume the Node process dies; state lives in the log (Ch.6).

## Build this

Port your Chapters 2–10 harness to TypeScript, or build it natively.

[`reference-harness/`](../reference-harness/) is already TypeScript, so the
fastest version of this exercise is to take it and replace one function —
`ModelProvider.decide` — with a real SDK call, then re-run `verify.sh` and see
which of its 34 assertions still hold once the model is non-deterministic. The
ones that break are the interesting ones.

1. **Schemas first.** Every tool defined once in Zod; derive both the TS type and
   the JSON Schema sent to the model. Zero hand-written duplicates.
2. **Parse at every boundary.** Model output, tool results, and config all go
   through `.parse()`. Turn a parse failure into a compacted error the loop can
   act on (Ch.2), not a crash.
3. **Cancellation.** Wire `AbortController` into every tool call. Enforce Ch.2's
   step, token, and wall-clock budgets by aborting, and verify a tool actually
   stops when aborted.
4. **Trace context.** Use `AsyncLocalStorage` so every span in a run carries the
   run ID without being passed explicitly. Emit OTel spans (Ch.8).
5. **Permissions.** Implement an allow-list and a hook that gates high-blast-radius
   tools behind approval (Ch.9).
6. **Prove the constraint.** Deliberately define a tool with a `z.discriminatedUnion`
   at the root, watch it get rejected, then fix it. Write the failure down — this
   is the kind of knowledge that only comes from hitting it.

## Check yourself

1. Why does a Zod schema at a tool boundary do three jobs at once, and what breaks if you hand-maintain any of the three separately?
2. What exactly fails when a tool's input schema has a union at the root, and where in the stack does the error appear?
3. In-process MCP server vs. subprocess: give the case for each, and name the Ch.9 property you give up choosing the first.
4. How do you enforce a wall-clock budget on a tool call that ignores cancellation? What's the honest answer?
5. Why is `AsyncLocalStorage` a better fit for trace context than a parameter, and what does it cost in testability?
6. Model returns a tool call whose arguments fail schema validation. Design the recovery: what goes back into context, and what stops an infinite retry?
7. TypeScript can't type "this string is a valid file path inside the sandbox." What does that push into runtime, and which chapter owns it?
