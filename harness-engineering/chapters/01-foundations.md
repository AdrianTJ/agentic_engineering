# Chapter 1 — Foundations: what a harness is, and where reliability comes from

> **Core question:** If two teams run the same model on the same task and one
> succeeds, what did the winning team actually build?

## The problem

The intuitive model of agent quality is that it tracks model quality: better
weights produce a better agent. This is wrong in a way that costs teams months.
OpenAI, Anthropic, LangChain, and ThoughtWorks have each reported the same
observation independently, which is that the same model wrapped differently
produces wildly different task completion rates. The variance lives in the
wrapper rather than in the weights.

That wrapper now has a name. OpenAI calls the discipline harness engineering,
while Martin Fowler and Birgitta Boeckeler arrived at the same object from the
maintenance side and describe harnesses as cybernetic governors for AI agents,
by which they mean feedforward guides and feedback sensors forming control loops
around a model. The most useful definition to memorize, though, is Lilian Weng's:

> The harness is the system surrounding a base model that orchestrates execution
> and decides how the model thinks and plans, calls tools and acts, perceives and
> manages context, stores artifacts, and evaluates results.

It is worth noticing what that definition does, which is to enumerate the rest of
this curriculum. Planning becomes Chapters 2 and 3, tools become Chapter 5,
context becomes Chapter 4, artifacts and state become Chapter 6, and evaluation
becomes Chapter 8. Chapter 9 covers the part the definition leaves implicit,
which is what the harness forbids.

## Core reading

**1. [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)** — OpenAI (Feb 2026) · ~20 min
This is the piece that named the discipline. A team shipped roughly a million
lines of production code over five months without hand-typing any of it, and the
account is almost entirely about what they built around the agents: the rules,
the feedback loops, the documentation structure, the dependency order. The line
worth sitting with is that discipline did not disappear from the work; it moved
out of the code and into the scaffolding.

The sharpest distinction in the piece, and the one this whole curriculum turns on:

> **Context engineering asks what the agent should see. Harness engineering asks
> what the system should prevent, measure, and correct.**

Two other principles are worth carrying forward. The first is to give the agent a
map rather than a manual, which in practice means a short `AGENTS.md` pointing at
deeper sources of truth instead of a thousand-page instruction file; this is
Chapter 5's progressive disclosure applied to documentation. The second is role
inversion, in which humans steer and specify while agents execute.

*Note: this URL rejects automated fetchers (403). The claims above are corroborated
by [InfoQ's report](https://www.infoq.com/news/2026/02/openai-harness-engineering-codex/)
and several independent summaries; see `SOURCES.md` and `PROVENANCE.md`.*

**2. [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/)** — Lilian Weng (Jul 2026) · ~45 min
This is the most rigorous survey of the object. Weng gives the definition quoted
above, then catalogues harness design patterns such as workflow automation,
filesystem-backed memory, and sub-agent coordination, before working through
harness optimization and the escalating ladder of self-improvement: optimize the
prompts, then the structured context, then the workflows, then the harness code,
and finally the optimizer itself. Two design rules from this piece recur
throughout the curriculum. The first is that durable state belongs in files
rather than in context windows. The second is that parallelism should be explicit
and inspectable. The post is dense, so budget the time.

**3. [The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)** — LangChain · ~20 min
The component breakdown. Six primitives: filesystem, code execution, sandbox,
memory and search, context management, planning and verification loops. This is
Most of this curriculum is one chapter per part, with cost (Chapter 7) and the
human interface (Chapter 10) added because they turned out to matter and the
parts list omits them. Read it as a parts list, and notice that the model itself
is not one of the parts.

**4. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)** — Anthropic · ~25 min
This is the oldest thing on the list and still the most load-bearing. It draws
the line between workflows and agents, where workflows orchestrate model and tool
calls through predefined code paths that you own, and agents let the model direct
its own process at runtime. It then gives the five composable workflow patterns
that Chapter 3 builds on: prompt chaining, routing, parallelization,
orchestrator-workers, and evaluator-optimizer. Its actual thesis, though, is a
discipline rather than a pattern. Find the simplest thing that works, and add
agency only when the flexibility is worth the latency, the cost, and the
compounding error.

**5. [Harness, Scaffold, and the AI Agent Terms Worth Getting Right](https://huggingface.co/blog/agent-glossary)** — Hugging Face · ~10 min
Read this one fifth, after you have watched four authors use the same words to
mean different things. It disentangles harness, scaffold, agent, and workflow.
You will not get a settled vocabulary out of the field as it stands, but you can
at least arrive at a consistent one for yourself.

## Going deeper

- **[Harness Engineering — first thoughts](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering-memo.html)** — Martin Fowler / Birgitta Boeckeler, in the [*Exploring Gen AI*](https://martinfowler.com/articles/exploring-gen-ai.html) memo series. The maintenance-side view: a continuously refined knowledge base embedded in the codebase, guardrails enforced by *deterministic* linters and structural tests (ArchUnit) rather than only by LLM judgment, and periodic "garbage collection" agents that hunt documentation drift and architectural violations. The insistence on deterministic guardrails is the useful corrective to LLM-judges-everything designs. Also worth the time in the same series: [*Context Engineering for Coding Agents*](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) and [*Humans and Agents in Software Engineering Loops*](https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html).
- **[awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering)** — the field's index. Sections: Foundations, Design Primitives, Reference Implementations, Security/Sandbox/Permissions, Evals & Verification, Templates. Use it as a bibliography to raid, not as reading.
- **[From Question Answering to Task Completion: A Survey on Agent System and Harness Design](https://arxiv.org/abs/2606.20683)** — the broadest academic survey of the area, and the best single map of how the field got from QA systems to harnesses. Start here if you want the lineage rather than the practice.
- **[Agent Harness Engineering: A Survey](https://openreview.net/pdf?id=eONq7FdiHa)** — a second, narrower academic treatment, if you want the taxonomy stated formally.
- **[Agent Harness Engineering](https://addyosmani.com/blog/agent-harness-engineering/)** — Addy Osmani. Practitioner synthesis; good for the four-pillar framing (context architecture, agent specialization, persistent memory, structured execution).
- **[Unlocking the Codex harness: how we built the App Server](https://openai.com/index/unlocking-the-codex-harness/)** — OpenAI's follow-up, on the harness as a product surface. Same 403 caveat.
- **[Awesome Agentic Patterns](https://www.agentic-patterns.com/)** — 97 patterns across 8 categories, each required to be repeatable, agent-centric, and backed by a public reference. The best-curated index in the field; a good place to go when a chapter here leaves you wanting a worked example.

## The claim, measured

This chapter opens with an assertion, which is that reliability is a property of
the model, harness, and environment taken together. As of 2026 it is no longer
only an assertion. [Harness-Bench](https://arxiv.org/abs/2605.27922) holds the
model fixed and varies the harness across 106 sandboxed tasks and 5,194 execution
trajectories, and it finds substantial variation in completion, process quality,
efficiency, and failure behaviour across model and harness pairings. Its
conclusion is the sentence to quote at anyone who benchmarks a model and then
calls it an agent:

> Agent capability should be reported at the model–harness configuration level
> rather than attributed to the base model alone.

Two neighbours are worth knowing about.
[Claw-SWE-Bench](https://arxiv.org/abs/2606.12344) evaluates agent harnesses on
coding tasks specifically, and [AgentMeter](https://arxiv.org/abs/2606.21140)
measures how well particular models match particular command-line tools, which is
the same insight one level down.

Read at least the Harness-Bench abstract before starting Chapter 2, because it
converts this curriculum's premise from a plausible story into a measured
effect.

## Key concepts

**Harness.** Everything around the model: the loop, the tools, the context
policy, the state, the verification, and the permissions.

**The model–harness–environment system.** The correct unit of analysis for
reliability. A benchmark that varies only the model is measuring one third of the
system and reporting it as the whole.

**Scaffolding rather than code.** The discipline moves from writing
implementations to designing the environment that implementations get written in.

**Cybernetic governor.** Feedforward guides such as specs, docs, and prompts,
combined with feedback sensors such as tests, linters, and graders, forming a
control loop. This is Fowler's framing, and it is the most durable metaphor the
field has produced.

**The agency dial.** Not a binary. The question is how much of the control flow
the model decides, and Chapter 3 is the whole answer.

**Deterministic guardrails.** Wherever a linter or a type checker exists, it
makes a better guardrail than a model-based judge, because its failure mode is
legible.

## Build this

Take a coding agent you already use (Claude Code, Codex, Cursor, an SDK loop you
wrote) and write a one-page **harness inventory**: for each of LangChain's six
primitives, name the concrete mechanism that implements it, or write "none."

The entries where you write "none" are the point of the exercise. Nearly every
harness has at least two of them, and those gaps predict its failure modes with
unnerving accuracy. Keep the page, because you will revise it after Chapters 4,
6, 8, and 9.

## Check yourself

1. Give an example in which a weaker model in a better harness should be expected to win, and say which primitive accounts for the result.
2. Anthropic says prefer workflows to agents where possible. What exactly is being traded away when you add agency, and which of the three costs bites first in a long-horizon task?
3. Fowler's guardrails are deliberately part deterministic. What does an ArchUnit test give you that a model-based reviewer cannot?
4. Weng's self-improvement ladder ends with the optimizer optimizing itself. At which rung do you lose the ability to tell whether things are improving, and what would you need to build to keep telling?
5. Which of the six harness primitives is most often missing in hobby agents, and what long-horizon failure does that absence produce?
