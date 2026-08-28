# Chapter 12 — Rust harness engineering

> **Core question:** Rust cannot make the model more reliable. What *can* it make
> reliable, and is that the part that's actually failing?

## The problem

Rust is the wrong default for a harness and the right choice for specific parts
of one, and being precise about which is the whole content of this chapter.

The honest case against: the model call dominates latency by three orders of
magnitude, so harness performance rarely matters; the ecosystem is younger; and
iteration speed on prompts and tool descriptions — the highest-leverage work in
Chapters 4, 5, and 8 — is faster in a scripting language.

The honest case for is narrower and real. **Sandboxes and MCP servers** are
long-lived processes that execute untrusted work under resource limits, where
cold start, memory footprint, and memory safety are load-bearing (the `rmcp`
ecosystem reports sub-5ms cold starts and 5–15 MB binaries against 300–800ms and
50–200 MB for Python — which matters exactly when Chapter 3's fan-out creates
environments per task and Chapter 9 wants them disposable). **Gateways and
policy brokers** sit on every request. And the **typestate pattern** can make
Chapter 6's illegal state transitions fail to compile rather than fail at hour six.

So: read this chapter to build the parts of a harness that must not fall over, not
to rewrite the whole thing.

## Core reading

**1. [`rmcp` — the official Rust MCP SDK](https://github.com/modelcontextprotocol/rust-sdk/blob/main/crates/rmcp/README.md)** · ~40 min
The most defensible reason to reach for Rust in this stack. Note the pluggable
`Transport` trait, the `rmcp-macros` procedural macros for generating tool
implementations from typed functions, and the feature flags (server, client,
Streamable HTTP, child-process, OAuth, schema generation). The macro path is the
Rust answer to Chapter 5's contract problem: derive the JSON Schema from the Rust
type so the definition and the implementation cannot drift.

**2. [`rig-core`](https://docs.rs/rig-core)** · ~40 min
The most-adopted Rust LLM framework, and worth reading as a trait design study.
Four composable traits: `CompletionModel`, `EmbeddingModel`, `VectorStore`, and
`Tool` (a callable with name, description, typed input/output). The `Agent`
struct is model + preamble + static context + tools. Read the `Tool` trait
against the Zod `tool()` helper from Chapter 11 — the same contract, one enforced
by a trait bound at compile time, one by a parser at runtime. Ask which failures
each catches.

**3. [The Typestate Pattern in Rust](https://cliffle.com/blog/rust-typestate/)** — Cliffle · ~30 min
The technique that justifies the language for harness work. Encode state in the
type: `Order<Created>`, `Order<Paid>`, `Order<Shipped>` rather than one type with
a state field. Transitions **consume `self`** and return the next type, which is
what makes an illegal transition a compile error rather than a runtime check —
and which is why the pattern is hard to express in languages without move
semantics. `PhantomData` carries the marker type when it has no runtime
representation.

Apply it to Chapter 6: `Run<AwaitingApproval>` has no `execute_tool` method. The
illegal transition that would have bitten at hour six does not build.

Read the downsides section honestly, because they bite in exactly this domain:
boilerplate scales with the number of states, and consuming-and-recreating a value
inside a loop is awkward — which an agent loop does on every iteration. The
`&mut self` variant relieves that, at the cost of some of the guarantee.

**4. [Typestate Programming](https://docs.rust-embedded.org/book/static-guarantees/typestate-programming.html)** — The Embedded Rust Book · ~20 min
The same idea from the community that has leaned on it longest, and clearer on
the cost: typestate makes *dynamic* state machines awkward. Since Chapter 3's
dynamic edges are exactly dynamic state, this is the boundary of the technique.
Knowing where it stops is more useful than knowing it.

**5. [How to Implement State Machines in Rust](https://oneuptime.com/blog/post/2026-02-01-rust-state-machines/view)** · ~25 min
The practical middle ground: enum-based state machines with exhaustive `match`.
Less absolute than typestate, but the compiler still forces you to handle every
state, which is most of the value for a harness whose transitions are chosen at
runtime.

**6. [Building AI Agents from Scratch in Rust](https://rustify.rs/articles/rust-ai-agents-from-scratch-2026)** · ~35 min
The end-to-end walkthrough: tokio async, streaming, tool dispatch. Read for how
Chapter 2's loop looks with `async`/`await`, and for the ownership questions that
appear once the conversation history is shared across concurrent tool calls.

## Going deeper

- **[Building MCP servers in Rust](https://rustify.rs/articles/rust-for-mcp-model-context-protocol-servers-2026)** — the concrete version of this chapter's strongest argument.
- **[Rust-native AI agent frameworks: architecture, performance, and the emerging ecosystem](https://zylos.ai/research/2026-04-01-rust-native-ai-agent-frameworks-ecosystem-2026/)** — ecosystem survey with measured numbers. Vendor research; read the methodology before the conclusions.
- **[`typestate-builder`](https://docs.rs/typestate-builder/latest/typestate_builder/)** — derive macros so typestate doesn't mean hand-writing every marker type.
- **Ecosystem worth a search each:** `tokio` structured concurrency (`JoinSet`, `select!`, cancellation tokens — the honest answer to Ch.11's manual-cancellation complaint), `serde` + `schemars` for deriving JSON Schema from Rust types, `tracing` + `tracing-opentelemetry` for Ch.8, and `wasmtime` or `landlock` for Ch.9 sandboxing.

## Key concepts

- **Typestate** — state at the type level; illegal transitions fail to compile. Bounded by the dynamic case.
- **Enum + exhaustive match** — the dynamic-friendly cousin; the compiler enforces total handling.
- **Trait-based tool contract** — `Tool` as a bound rather than a runtime schema check.
- **Schema derivation** — `schemars`/`rmcp-macros` generate the model-facing JSON Schema from the Rust type, so contract and implementation cannot drift. The Rust answer to Chapter 5's drift problem.
- **Structured concurrency** — `JoinSet` and cancellation tokens give Ch.3's fan-out real cancellation semantics.
- **Cold start and footprint** — why Rust for sandboxes and per-task environments specifically.
- **Send + Sync at the loop boundary** — the ownership question that shows up the moment tool calls run concurrently over shared history.
- **The right seam** — Rust for MCP servers, sandboxes, gateways, policy brokers; something faster-iterating for prompts, tools, and evals.

## Build this

Two exercises. The first is the realistic one.

**A. An MCP server in Rust (do this one).**
Take three tools from your Chapter 5 exercise and implement them as an `rmcp`
server. Derive the JSON Schema from Rust types — no hand-written schema anywhere.
Add resource limits and an egress allow-list (Ch.9). Point your Chapter 11
TypeScript harness at it over stdio. You now have the polyglot shape most real
systems converge on: fast-iterating harness, hardened tool servers.

**B. A typestate run lifecycle (do this one to learn the boundary).**
Model Chapter 6's lifecycle in the type system:
`Run<Planning> → Run<Executing> → Run<AwaitingApproval> → Run<Executing> → Run<Complete>`.
`execute_tool` exists only on `Run<Executing>`. `resume(approval)` only on
`Run<AwaitingApproval>`.

Then try to add a *dynamic* edge — the model chooses the next state at runtime —
and watch typestate fight you. Solve it with an enum wrapper and write down what
you traded. That trade is the real content of this chapter, and the reason a
harness usually wants both techniques in different places.

## Check yourself

1. Give the strongest honest argument *against* writing your harness in Rust.
2. Name two harness components where Rust clearly wins, and the property that makes each case.
3. What does typestate catch that a runtime state machine catches only in production? Give a Ch.6 example.
4. Why does typestate become awkward for Ch.3's dynamic edges? What's the escape hatch and its cost?
5. `rig`'s `Tool` trait vs. Zod's `tool()`: which errors does each catch, and when?
6. Deriving JSON Schema from Rust types prevents a specific class of bug. Name it, and say what the equivalent discipline is in TypeScript.
7. You have one engineer-month. Rewrite the loop in Rust, or write the MCP servers and sandbox in Rust and leave the loop in TypeScript? Defend it in terms of where reliability is actually lost.

## Capstone

You now have every piece. Build one harness that runs a genuinely long task —
several hours, spanning at least one crash and one human approval — and write a
short report:

- The graph, with every edge marked static or dynamic (Ch.3).
- The retention contract and measured token curve (Ch.4).
- The tool set with its fixed context cost as a share of the window (Ch.5).
- The event log, with a demonstrated `kill -9` recovery (Ch.6).
- Traces and a regression suite with a committed baseline (Ch.8).
- The threat model, including a documented injection attempt and its outcome (Ch.9).
- Three hill-climbing iterations with recorded deltas — including the one that
  made things worse (Ch.8).

The last item is the one that proves you understood the curriculum. A harness
engineer is someone who changed a harness and can prove what the change did.
