# Chapter 1 — Foundations: what a harness is, and where reliability comes from

> **Core question:** If two teams run the same model on the same task and one
> succeeds, what did the winning team actually build?

## The problem

The intuitive model of agent quality is that it tracks model quality: better
weights, better agent. It is wrong in a way that costs teams months. The observable
fact — reported independently by OpenAI, Anthropic, LangChain, and ThoughtWorks —
is that the same model, wrapped differently, produces wildly different task
completion rates. The variance lives in the wrapper.

The wrapper has a name now. OpenAI calls the discipline **harness engineering**;
Martin Fowler and Birgitta Boeckeler arrived at the same object from the
maintenance side and describe harnesses as *cybernetic governors for AI agents* —
feedforward guides and feedback sensors forming control loops around an LLM.
Lilian Weng's definition is the most useful one to memorize:

> The harness is the system surrounding a base model that orchestrates execution
> and decides how the model thinks and plans, calls tools and acts, perceives and
> manages context, stores artifacts, and evaluates results.

Note what that definition does: it enumerates the rest of this curriculum.
Planning (Ch.2, 3), tools (Ch.5), context (Ch.4), artifacts and state (Ch.6),
evaluation (Ch.8). Chapter 9 covers the part the definition leaves implicit —
what the harness *forbids*.

## Core reading

**1. [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)** — OpenAI (Feb 2026) · ~20 min
The piece that named the discipline. A team shipped roughly a million lines of
production code over five months without hand-typing any of it, and the account is
about what they built *around* the agents: the rules, feedback loops, docs
structure, and dependency order. The line to sit with is that discipline didn't
disappear, it moved — from the code into the scaffolding.

The sharpest distinction in the piece, and the one this whole curriculum turns on:

> **Context engineering asks what the agent should see. Harness engineering asks
> what the system should prevent, measure, and correct.**

Two other principles worth carrying: *give the agent a map, not a manual* — a short
`AGENTS.md` pointing at deeper sources of truth, rather than a thousand-page
instruction file (this is Ch.5's progressive disclosure applied to documentation);
and *role inversion* — humans steer and specify, agents execute.

*Note: this URL rejects automated fetchers (403). The claims above are corroborated
by [InfoQ's report](https://www.infoq.com/news/2026/02/openai-harness-engineering-codex/)
and several independent summaries; see `SOURCES.md` and `PROVENANCE.md`.*

**2. [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)** — Lilian Weng (Jul 2026) · ~45 min
The most rigorous survey of the object. Weng gives the definition above, then
catalogues harness design patterns (workflow automation, filesystem-backed memory,
sub-agent coordination), harness optimization, and the escalating ladder of
self-improvement: optimize prompts → structured context → workflows → harness
code → the optimizer itself. Two design rules from here recur throughout this
curriculum: **keep durable state in files, not context windows**, and **make
parallelism explicit and inspectable**. Dense; budget the time.

**3. [The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)** — LangChain · ~20 min
The component breakdown. Six primitives: filesystem, code execution, sandbox,
memory and search, context management, planning and verification loops. This is
the best single map of *what parts exist*; most of this curriculum is one chapter
per part, with cost (Ch.7) and the human interface (Ch.10) added because they
turned out to matter and the parts list omits them. Read it as a parts list, and notice that "the model" is not
one of the parts.

**4. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** — Anthropic · ~25 min
The oldest thing on this list and still the most load-bearing. It draws the
workflow/agent line — *workflows* orchestrate LLM and tool calls through
predefined code paths you own; *agents* let the model direct its own process at
runtime — and gives the five composable workflow patterns (prompt chaining,
routing, parallelization, orchestrator-workers, evaluator-optimizer) that
Chapter 3 builds on. Its actual thesis is a discipline, not a pattern: find the
simplest thing that works and add agency only when flexibility is worth the
latency, cost, and compounding error.

**5. [Harness, Scaffold, and the AI Agent Terms Worth Getting Right](https://huggingface.co/blog/agent-glossary)** — Hugging Face · ~10 min
Read this fifth, once you've seen four authors use the words differently. It
disentangles harness/scaffold/agent/workflow. You will not get a settled
vocabulary out of the field, but you can at least get a consistent one for
yourself.

## Going deeper

- **[Harness Engineering — first thoughts](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering-memo.html)** — Martin Fowler / Birgitta Boeckeler, in the [*Exploring Gen AI*](https://martinfowler.com/articles/exploring-gen-ai.html) memo series. The maintenance-side view: a continuously refined knowledge base embedded in the codebase, guardrails enforced by *deterministic* linters and structural tests (ArchUnit) rather than only by LLM judgment, and periodic "garbage collection" agents that hunt documentation drift and architectural violations. The insistence on deterministic guardrails is the useful corrective to LLM-judges-everything designs. Also worth the time in the same series: [*Context Engineering for Coding Agents*](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) and [*Humans and Agents in Software Engineering Loops*](https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html).
- **[awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering)** — the field's index. Sections: Foundations, Design Primitives, Reference Implementations, Security/Sandbox/Permissions, Evals & Verification, Templates. Use it as a bibliography to raid, not as reading.
- **[From Question Answering to Task Completion: A Survey on Agent System and Harness Design](https://arxiv.org/abs/2606.20683)** — the broadest academic survey of the area, and the best single map of how the field got from QA systems to harnesses. Start here if you want the lineage rather than the practice.
- **[Agent Harness Engineering: A Survey](https://openreview.net/pdf?id=eONq7FdiHa)** — a second, narrower academic treatment, if you want the taxonomy stated formally.
- **[Agent Harness Engineering](https://addyosmani.com/blog/agent-harness-engineering/)** — Addy Osmani. Practitioner synthesis; good for the four-pillar framing (context architecture, agent specialization, persistent memory, structured execution).
- **[Unlocking the Codex harness: how we built the App Server](https://openai.com/index/unlocking-the-codex-harness/)** — OpenAI's follow-up, on the harness as a product surface. Same 403 caveat.
- **[Awesome Agentic Patterns](https://www.agentic-patterns.com/)** — 97 patterns across 8 categories, each required to be repeatable, agent-centric, and backed by a public reference. The best-curated index in the field; a good place to go when a chapter here leaves you wanting a worked example.

## The claim, measured

Chapter 1 opens with an assertion — reliability is a property of the
model–harness–environment system. As of 2026 that is no longer only an
assertion. **[Harness-Bench](https://arxiv.org/abs/2605.27922)** holds the model
fixed and varies the harness across 106 sandboxed tasks and 5,194 execution
trajectories, and finds substantial variation in completion, process quality,
efficiency, and failure behavior across model–harness pairings. Its conclusion is
the sentence to quote at anyone who benchmarks a model and calls it an agent:

> Agent capability should be reported at the model–harness configuration level
> rather than attributed to the base model alone.

Also worth knowing: **[Claw-SWE-Bench](https://arxiv.org/abs/2606.12344)**
evaluates agent *harnesses* on coding tasks specifically, and
**[AgentMeter](https://arxiv.org/abs/2606.21140)** measures model–CLI matching —
the same insight at the level of which agent suits which command-line tool.

Read at least the Harness-Bench abstract before Chapter 2. It converts this
curriculum's premise from a plausible story into a measured effect.

## Key concepts

- **Harness** — everything around the model: loop, tools, context policy, state, verification, permissions.
- **Model–harness–environment system** — the correct unit of analysis for reliability. Benchmarks that vary only the model measure one third of the system.
- **Scaffolding, not code** — the discipline moves from writing implementations to designing the environment implementations get written in.
- **Cybernetic governor** — feedforward (specs, docs, prompts) plus feedback (tests, linters, graders) forming a control loop. Fowler's frame; the most durable metaphor in the field.
- **The agency dial** — not a binary. How much of the control flow does the model decide? Chapter 3 is the whole answer.
- **Deterministic guardrails** — a linter or a type checker is a better guardrail than an LLM judge wherever one exists, because its failure mode is legible.

## Build this

Take a coding agent you already use (Claude Code, Codex, Cursor, an SDK loop you
wrote) and write a one-page **harness inventory**: for each of LangChain's six
primitives, name the concrete mechanism that implements it, or write "none."

The "none" entries are the point. Nearly every harness has at least two, and the
gaps predict its failure modes with unnerving accuracy. Keep this page — you will
revise it after Chapters 4, 6, 8, and 9.

## Check yourself

1. Give an example where a *weaker* model in a better harness should be expected to win, and say which primitive accounts for the win.
2. Anthropic says prefer workflows to agents where possible. What exactly is being traded away when you add agency, and which of the three costs bites first in a long-horizon task?
3. Fowler's guardrails are deliberately partly deterministic. What does an ArchUnit test give you that an LLM reviewer cannot?
4. Weng's self-improvement ladder ends with the optimizer optimizing itself. At which rung do you lose the ability to tell whether things are improving, and what would you need to build to keep telling?
5. Which of the six harness primitives is *most* often missing in hobby agents, and what long-horizon failure does that absence produce?
