# Chapter 5 — Tools, their definitions, and the protocols that carry them

> **Core question:** A tool is a contract between a deterministic system and a
> non-deterministic caller that reads the contract at runtime and may misread
> it. How do you write that contract?

## The problem

Tool definitions are the most under-designed surface in most harnesses, and
also the highest-leverage one. The reason is a category error. People write
tools the way they write functions for other programmers, or endpoints for
other services, but the caller here is a model. The description doubles as the
API documentation and the implementation prompt at once, and every token of it
is billed against Chapter 4's budget on every single turn.

Anthropic's framing is the one to internalize. Tools are a genuinely new
software paradigm, a contract between a deterministic system and a
non-deterministic agent, and the consequences are specific. Tools must be
self-contained, robust to misuse, and unambiguous about their intended use.
Parameters must play to the model's strengths, which means `user_id` and never
`user`. And the best-supported optimization technique in the literature is not
clever code but prompt-engineering the tool descriptions, because those
descriptions sit in context and steer behavior on every turn.

There is also a systems problem hiding underneath. Tool definitions are fixed
context cost. Fifty tools at 300 tokens each is 15,000 tokens gone before the
task starts, on every request. Tool design and context engineering are the same
budget.

## Core reading

**1. [Writing effective tools for AI agents — using AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents)** — Anthropic · ~35 min
This is the core text. It sets out a three-phase method of prototyping,
evaluating, and optimizing, and then the principles that matter most. Prefer
search over listing, because a `list_all` tool floods context while a `search`
tool returns what is needed; put the filter at the source. Consolidate, because
fewer and better tools beat many thin wrappers, and every tool is both fixed
context cost and a fresh chance to pick wrong. Namespace, so that
`slack_send_message` wins over `send_message` whenever several services could
plausibly own the verb. Design the response, because what comes back is
context; return the useful fields rather than the whole payload, and keep the
shape stable. Spend tokens carefully in both directions, in the definition and
in the response. Treat every error as a prompt, since "404" teaches nothing
while "No user with id=X. Use search_users(email) to find the id." teaches the
retry. And write the description as a prompt, because that is what it is.

The methodological point is the underrated one: evaluate your tools. Build a
small eval set, watch where the agent misuses a tool, and fix the description
before touching the code. Most tool bugs are documentation bugs.

**2. [Model Context Protocol specification](https://modelcontextprotocol.io/)** — ~45 min
This is the standard for exposing tools across harnesses, and the architecture
is worth learning precisely because the security chapter depends on it. Hosts
initiate and coordinate clients, supervise their lifecycles, enforce consent
policy, and route model calls. Clients manage stateful sessions. Servers
provide tools and data as independent processes. Note Roots in particular,
which are client-declared directory and URI boundaries that a server may
access, and note hard that Roots is a coordination mechanism rather than a
security control. Real isolation happens at the operating-system level, which
is Chapter 9's subject.

**3. [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)** — factors #1, #4, #7 · ~20 min
Three of the twelve factors belong to this chapter. Factor 1, natural language
to tool calls, states the primitive operation plainly. Factor 4, tools are just
structured outputs, is the demystification: a tool call is JSON the model
emitted, and your code decides what it means, a reframing that kills a good
deal of magical thinking and makes tools testable. Factor 7, contact humans
with tool calls, treats human input as a tool rather than as a special case in
the loop, which is elegant and makes human-in-the-loop composable with
everything else in Chapter 6.

**4. [Harnessing Agent Skills: Architectural Patterns and a Reference Architecture for Skill-Mediated LLM Agents](https://arxiv.org/abs/2606.20631)** · ~40 min
Skills, meaning instructions loaded on demand, are the layer above tools. The
pattern is progressive disclosure: a short description that is always loaded,
with the detail pulled in only when it becomes relevant. This is Chapter 4's
just-in-time retrieval applied to the agent's own instructions, and it is how
you get a large capability surface without paying for all of it on every turn.

## Going deeper

- **[AI SDK: tools and tool calling](https://github.com/vercel/ai/blob/main/content/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx)** shows schema-first tool definition in practice, and Chapter 11 picks it up properly.
- **[rig-core `Tool` trait](https://docs.rs/rig-core)** is the same contract expressed in static types, for Chapter 12.
- **[Agent Skills specification](https://agentskills.io/specification)** is the format this very repository is built on. Read `.ruler/skills/general/write-skill/SKILL.md` here for the craft, and notice that an agent decides whether to load a skill from its `description` alone, which is the description-engineering problem one level up.
- **[Understanding MCP Security](https://www.wiz.io/academy/ai-security/model-context-protocol-security)** should wait until after Chapter 9.

## Key concepts

**Tool as contract.** A deterministic implementation, a non-deterministic
caller, and a natural-language specification between them.

**Description engineering.** The description is a prompt. Optimize it with
evals rather than taste.

**Parameter unambiguity.** `user_id` over `user`, because names are
instructions.

**Search over listing.** Return the relevant subset rather than the corpus.

**Consolidation and namespacing.** Fewer tools, with unambiguous names.

**Response design.** The return value is context, so shape it deliberately.

**Errors as prompts.** Every error message should name the recovery.

**Fixed context cost.** Tool definitions are billed on every turn, before any
work happens.

**MCP host, client, and server.** The three roles of the protocol. Consent and
policy live in the host.

**Roots.** Declared boundaries. Coordination, not enforcement.

**Skills and progressive disclosure.** Capability without permanent context
cost.

## Build this

Take five tools you already have, or write five over a real API, and put them
through the full method.

1. Establish a baseline. Write ten realistic tasks, run the agent, log every
   tool call, and classify the failures into wrong tool, wrong parameters, and
   right call but wrong interpretation of the result.
2. Fix the descriptions only, with no code changes, and re-run. Record the
   delta. This is usually the largest single improvement you will measure all
   week.
3. Consolidate. Merge the thin wrappers, replace a `list_*` with a `search_*`,
   and measure the token cost of the definitions before and after.
4. Rewrite every error message to name the recovery path, re-run, and count how
   many failures now self-correct within one iteration.
5. Write down the fixed context cost of your tool set as a percentage of the
   window. Above 10 percent, you have a Chapter 4 problem disguised as a
   Chapter 5 problem.

If you want the measurement without building an API integration first,
[`reference-harness/`](../reference-harness/) already reports tool-definition
cost as its own line in the context breakdown:

```sh
SCRIPT=long node harness.ts   # look at the `tools` row
```

In its default configuration, five tools cost 95 tokens against a 400-token
window, which is 24 percent of the budget spent before any work happens, and
the share climbs linearly with every tool you add. It was 14.5 percent with
three tools two passes earlier; adding two tools cost a tenth of the window,
and nobody noticed until an audit. Add five plausible tools with realistic
descriptions, re-run, and watch the share move. That number is the argument for
consolidation and progressive disclosure, and it persuades better as a
measurement than as advice.

## Check yourself

1. Why is `user_id` a better parameter name than `user`? Give the failure that `user` produces.
2. When does one consolidated tool beat three specific ones, and when is that the wrong trade?
3. Write the error message for "file not found" that maximizes the chance the next iteration succeeds.
4. You have forty tools. Name three mechanisms for keeping them out of the window until needed, and the cost of each.
5. Roots is not a security boundary. What is one, and why does Roots not qualify?
6. Tools are just structured outputs. What does that framing let you test that you could not test otherwise?
7. What does progressive disclosure of skills buy over simply writing a longer system prompt? Quantify the answer against Chapter 4's budget.
