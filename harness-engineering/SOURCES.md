# Sources

The full bibliography, 95 entries. Each is cited from at least one
chapter; several are cited from three or more, which is a reasonable signal of
which pieces are load-bearing.

`sources.tsv` holds the same list in machine-readable form.
`bin/check-links.sh` validates that every one resolves; `bin/check-coverage.sh`
validates that every URL linked from a chapter is registered here.

## Reading the fetch note

| Value | Meaning |
|---|---|
| `ok` | Returned 2xx to an automated fetch at last check |
| `bot-blocked-403` | Live, but rejects automated fetchers (Cloudflare or similar) |
| `egress-403` | Blocked by this environment's egress policy, not by the host |
| `…-verified-via-webfetch` | Blocked to `curl`, but content confirmed through a different fetch path |
| `unchecked` | Registered and link-checked but not yet read end to end; only ever used for *Going deeper* entries |

A `403` is not a dead link. Every `403` entry below was either confirmed through
an alternate fetch path or corroborated by multiple independent citing sources;
`PROVENANCE.md` records which, per source.

## Most-cited sources

Cited from three or more chapters. If you read nothing else, read these.

| Source | Chapters |
|---|---|
| [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — Dex Horthy / HumanLayer | 02,03,05,06,09 |
| [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/) — Lilian Weng | 01,02,04,08 |
| [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic | 01,02,03 |
| [The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness) — LangChain | 01,04,09 |
| [Exploring Gen AI (memo series)](https://martinfowler.com/articles/exploring-gen-ai.html) — Martin Fowler / Birgitta Boeckeler | 01,08,09 |

## By chapter

### Chapter 01 — Foundations

**Core reading**

- `S001` [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic
- `S002` [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Anthropic
- `S005` [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) — OpenAI · `bot-blocked-403`
- `S006` [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/) — Lilian Weng
- `S007` [The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness) — LangChain
- `S010` [Harness, Scaffold, and the AI Agent Terms Worth Getting Right](https://huggingface.co/blog/agent-glossary) — Hugging Face
- `S069` [InfoQ: OpenAI Introduces Harness Engineering](https://www.infoq.com/news/2026/02/openai-harness-engineering-codex/) — InfoQ

**Going deeper**

- `S042` [Exploring Gen AI (memo series)](https://martinfowler.com/articles/exploring-gen-ai.html) — Martin Fowler / Birgitta Boeckeler
- `S043` [awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering) — ai-boost · `egress-403-verified-via-webfetch`
- `S044` [Agent Harness Engineering: A Survey](https://openreview.net/pdf?id=eONq7FdiHa) — OpenReview · `egress-403`
- `S045` [Agent Harness Engineering](https://addyosmani.com/blog/agent-harness-engineering/) — Addy Osmani
- `S064` [Harness Engineering — first thoughts](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering-memo.html) — Fowler / Boeckeler
- `S065` [Context Engineering for Coding Agents](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) — Fowler / Boeckeler
- `S066` [Humans and Agents in Software Engineering Loops](https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html) — Fowler / Boeckeler
- `S070` [Unlocking the Codex harness: how we built the App Server](https://openai.com/index/unlocking-the-codex-harness/) — OpenAI · `bot-blocked-403`
- `S071` [Awesome Agentic Patterns](https://www.agentic-patterns.com/) — nibzard
- `S091` [From Question Answering to Task Completion: A Survey on Agent System and Harness Design](https://arxiv.org/abs/2606.20683) — arXiv

### Chapter 02 — The loop

**Core reading**

- `S001` [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic
- `S006` [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/) — Lilian Weng
- `S008` [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering) — LangChain
- `S009` [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — Dex Horthy / HumanLayer · `egress-403-verified-via-webfetch`
- `S011` [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) — Yao et al. (ICLR 2023)

**Going deeper**

- `S061` [Agent Harness Architecture: Building a Coding Agent From Scratch](https://levelup.gitconnected.com/agent-harness-architecture-building-a-coding-agent-from-scratch-ad42a86a74e8) — Plaban Nayak · `unchecked`

### Chapter 03 — Graphs & control flow

**Core reading**

- `S001` [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic
- `S009` [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — Dex Horthy / HumanLayer · `egress-403-verified-via-webfetch`
- `S012` [LangGraph Graph API overview](https://docs.langchain.com/oss/python/langgraph/graph-api) — LangChain
- `S013` [Deep Agents overview](https://docs.langchain.com/oss/python/deepagents/overview) — LangChain
- `S026` [Temporal: Beyond State Machines for Reliable Distributed Applications](https://temporal.io/blog/temporal-replaces-state-machines-for-distributed-applications) — Temporal
- `S027` [LangGraph State: Checkpoints, Threads, and Recovery](https://eastondev.com/blog/en/posts/ai/20260424-langgraph-agent-architecture/) — Easton
- `S072` [Building LangGraph: designing an agent runtime from first principles](https://www.langchain.com/blog/building-langgraph) — LangChain

**Going deeper**

- `S004` [Building a multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — Anthropic
- `S062` [Deep Dive: 12 Reusable Agentic Harness Design Patterns from Claude Code](https://www.epsilla.com/blogs/2026-04-18-deep-dive-12-reusable-agentic-harness-design-patte) — Epsilla · `unchecked`
- `S092` [Agent2Agent (A2A) Protocol](https://a2a-protocol.org/latest/) — Linux Foundation
- `S093` [Announcing the Agent2Agent Protocol](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) — Google
- `S094` [A survey of agent interoperability protocols: MCP, ACP, A2A, ANP](https://arxiv.org/abs/2505.02279) — arXiv
- `S095` [Governance Gaps in Agent Interoperability Protocols](https://arxiv.org/abs/2606.31498) — arXiv

### Chapter 04 — Context & memory

**Core reading**

- `S002` [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Anthropic
- `S006` [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/) — Lilian Weng
- `S007` [The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness) — LangChain
- `S014` [Context engineering: memory, compaction, and tool clearing](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools) — Claude Cookbook
- `S015` [Context management in agent harnesses: memory, files, and subagents](https://arize.com/blog/context-management-in-agent-harnesses/) — Arize
- `S016` [Context Engineering 101: How agents manage context](https://newsletter.victordibia.com/p/context-engineering-101-how-agents) — Victor Dibia

**Going deeper**

- `S017` [Memory as Action: Autonomous Context Curation for Long-Horizon Agentic Tasks](https://arxiv.org/abs/2510.12635) — arXiv
- `S018` [Awesome-Long-Horizon-Agents](https://github.com/RUC-NLPIR/Awesome-Long-Horizon-Agents) — RUC-NLPIR · `egress-403`
- `S019` [Shedding Heavy Memories: Context Compaction in Codex, Claude Code, OpenCode](https://justin3go.com/en/posts/2026/04/09-context-compaction-in-codex-claude-code-and-opencode) — Justin3go
- `S020` [Less Context, Better Agents](https://arxiv.org/abs/2606.10209) — arXiv
- `S065` [Context Engineering for Coding Agents](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) — Fowler / Boeckeler
- `S090` [Meta Context Engineering via Agentic Skill Evolution](https://arxiv.org/abs/2601.21557) — Ye et al. (ICML 2026)

### Chapter 05 — Tools & definitions

**Core reading**

- `S003` [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents) — Anthropic
- `S009` [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — Dex Horthy / HumanLayer · `egress-403-verified-via-webfetch`
- `S021` [Model Context Protocol specification](https://modelcontextprotocol.io/) — MCP
- `S022` [Harnessing Agent Skills: Architectural Patterns and a Reference Architecture](https://arxiv.org/abs/2606.20631) — arXiv
- `S023` [AI SDK: tools and tool calling](https://github.com/vercel/ai/blob/main/content/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx) — Vercel · `egress-403`

**Going deeper**

- `S024` [Agent Skills specification](https://agentskills.io/specification) — agentskills.io · `unchecked`

### Chapter 06 — State, durability, resumption

**Core reading**

- `S009` [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — Dex Horthy / HumanLayer · `egress-403-verified-via-webfetch`
- `S025` [Durable Execution meets AI](https://temporal.io/blog/durable-execution-meets-ai-why-temporal-is-the-perfect-foundation-for-ai) — Temporal
- `S026` [Temporal: Beyond State Machines for Reliable Distributed Applications](https://temporal.io/blog/temporal-replaces-state-machines-for-distributed-applications) — Temporal
- `S027` [LangGraph State: Checkpoints, Threads, and Recovery](https://eastondev.com/blog/en/posts/ai/20260424-langgraph-agent-architecture/) — Easton
- `S028` [Agent Workflows Are Rediscovering Durable Execution](https://medium.com/beyond-localhost/agent-workflows-are-rediscovering-durable-execution-be110661ed8c) — Koshy
- `S072` [Building LangGraph: designing an agent runtime from first principles](https://www.langchain.com/blog/building-langgraph) — LangChain
- `S089` [Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes](https://arxiv.org/abs/2604.28138) — Wu et al.

**Going deeper**

- `S029` [Durable AI Agents: Orchestrating with Fred and Temporal](https://fredk8.dev/blog/durable-ai-agents-orchestrating-the-future-with-fred-and-temporal/) — fredk8.dev
- `S030` [Durable Execution for AI Agents: State, Retries, Pauses](https://quellixlabs.com/insights/durable-execution-long-running-ai-agent-workflows) — Quellix Labs

### Chapter 07 — Cost, caching & economics

**Core reading**

- `S073` [Don't Break the Cache: Prompt Caching for Long-Horizon Agentic Tasks](https://arxiv.org/abs/2601.06007) — arXiv
- `S074` [Prompt Caching with Deep Agents](https://www.langchain.com/blog/deep-agents-prompt-caching) — LangChain
- `S075` [Agent-as-a-Router: Agentic Model Routing for Coding Tasks](https://arxiv.org/abs/2606.22902) — arXiv
- `S076` [AI Agent Cost Optimization: cutting LLM spend with routing](https://www.requesty.ai/blog/ai-agent-cost-optimization-how-to-cut-llm-spend-by-80-percent-with-routing) — Requesty
- `S077` [Prompt Caching Economics: cache-first agent design](https://www.digitalapplied.com/blog/prompt-caching-economics-cache-first-agent-architecture-2026) — Digital Applied

**Going deeper**

- `S078` [AI Agent Token Cost Optimization](https://fast.io/resources/ai-agent-token-cost-optimization/) — Fastio
- `S079` [How LLM agent loops break caching](https://www.tensormesh.ai/blog-posts/agentic-ai-inference-cost-kv-caching-production) — Tensormesh · `unchecked`
- `S080` [Self-Compacting Language Model Agents](https://arxiv.org/abs/2606.23525) — arXiv · `unchecked`

### Chapter 08 — Verification, evals & observability

**Core reading**

- `S003` [Writing effective tools for AI agents](https://www.anthropic.com/engineering/writing-tools-for-agents) — Anthropic
- `S006` [Harness Engineering for Self-Improvement](https://lilianweng.github.io/posts/2026-07-04-harness/) — Lilian Weng
- `S008` [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering) — LangChain
- `S031` [Agent observability: the complete guide](https://www.braintrust.dev/articles/agent-observability-complete-guide-2026) — Braintrust
- `S032` [OpenTelemetry GenAI semantic conventions](https://greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions) — Greptime
- `S033` [LLM tracing and agent observability](https://mlflow.org/docs/latest/genai/tracing/) — MLflow

**Going deeper**

- `S034` [AI Agent Observability](https://www.langchain.com/resources/agent-observability) — LangChain
- `S035` [SWE-EVO: Benchmarking Coding Agents in Long-Horizon Software Evolution](https://arxiv.org/abs/2512.18470) — arXiv
- `S042` [Exploring Gen AI (memo series)](https://martinfowler.com/articles/exploring-gen-ai.html) — Martin Fowler / Birgitta Boeckeler
- `S067` [TDD inside the agent loop — theater or actual value?](https://martinfowler.com/articles/exploring-gen-ai/tdd-in-the-agent-loop.html) — Fowler / Boeckeler

### Chapter 09 — Security, sandboxing & permissions

**Core reading**

- `S007` [The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness) — LangChain
- `S009` [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) — Dex Horthy / HumanLayer · `egress-403-verified-via-webfetch`
- `S021` [Model Context Protocol specification](https://modelcontextprotocol.io/) — MCP
- `S036` [Understanding Model Context Protocol Security](https://www.wiz.io/academy/ai-security/model-context-protocol-security) — Wiz
- `S037` [Securing the AI Agent Revolution: A Practical Guide to MCP Security](https://www.coalitionforsecureai.org/securing-the-ai-agent-revolution-a-practical-guide-to-mcp-security/) — Coalition for Secure AI · `bot-blocked-403`
- `S038` [Securing the Model Context Protocol: Risks, Controls, Governance](https://arxiv.org/abs/2511.20920) — arXiv
- `S039` [Towards Secure Agent Skills: Architecture, Threat Taxonomy, Security Analysis](https://arxiv.org/abs/2604.02837) — arXiv
- `S063` [Model Context Protocol (MCP) Security (whitepaper)](https://www.coalitionforsecureai.org/wp-content/uploads/2026/03/model-context-protocol-security-1.pdf) — CoSAI
- `S088` [The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) — Simon Willison

**Going deeper**

- `S040` [AgentBound: Securing Execution Boundaries of AI Agents](https://arxiv.org/abs/2510.21236) — arXiv
- `S041` [Caller Identity Confusion in MCP-Based AI Systems](https://arxiv.org/abs/2603.07473) — arXiv
- `S042` [Exploring Gen AI (memo series)](https://martinfowler.com/articles/exploring-gen-ai.html) — Martin Fowler / Birgitta Boeckeler
- `S062` [Deep Dive: 12 Reusable Agentic Harness Design Patterns from Claude Code](https://www.epsilla.com/blogs/2026-04-18-deep-dive-12-reusable-agentic-harness-design-patte) — Epsilla · `unchecked`
- `S068` [Coding Assistants Threaten the Software Supply Chain](https://martinfowler.com/articles/exploring-gen-ai/software-supply-chain-attack-surface.html) — Fowler / Boeckeler

### Chapter 10 — Long-running operations & the human interface

**Core reading**

- `S081` [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) — Anthropic
- `S082` [Long-running Agents](https://addyosmani.com/blog/long-running-agents/) — Addy Osmani
- `S083` [Agent Handoff Patterns: human–agent interface guide](https://www.augmentcode.com/guides/agent-handoff-patterns-human-agent-interface) — Augment Code
- `S084` [Interaction as Intelligence II: Asynchronous Human-Agent Rollout](https://arxiv.org/abs/2510.27630) — arXiv

**Going deeper**

- `S071` [Awesome Agentic Patterns](https://www.agentic-patterns.com/) — nibzard
- `S085` [Long-running AI agents that pause, resume, never lose context (ADK)](https://developers.googleblog.com/build-long-running-ai-agents-that-pause-resume-and-never-lose-context-with-adk/) — Google
- `S086` [Long Running Agent Engineering](https://nicolasbustamante.com/blog/long-running-agent-engineering) — Nicolas Bustamante
- `S087` [The Shift to Agentic AI: Evidence from Codex](https://arxiv.org/abs/2606.26959) — arXiv · `unchecked`

### Chapter 11 — TypeScript harness engineering

**Core reading**

- `S023` [AI SDK: tools and tool calling](https://github.com/vercel/ai/blob/main/content/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx) — Vercel · `egress-403`
- `S033` [LLM tracing and agent observability](https://mlflow.org/docs/latest/genai/tracing/) — MLflow
- `S046` [Agent SDK reference — TypeScript](https://code.claude.com/docs/en/sdk/sdk-typescript) — Anthropic · `unchecked`
- `S047` [Zod — defining schemas](https://zod.dev/api) — Zod · `unchecked`
- `S048` [Zod — basic usage](https://zod.dev/basics) — Zod · `unchecked`
- `S049` [AI SDK 6](https://vercel.com/blog/ai-sdk-6) — Vercel
- `S052` [rmcp — official Rust MCP SDK](https://github.com/modelcontextprotocol/rust-sdk/blob/main/crates/rmcp/README.md) — modelcontextprotocol · `egress-403`

**Going deeper**

- `S050` [Structured outputs with the Vercel AI SDK](https://www.aihero.dev/structured-outputs-with-vercel-ai-sdk) — AI Hero · `unchecked`
- `S051` [strands-agents/sdk-typescript](https://github.com/strands-agents/sdk-typescript) — Strands · `egress-403`

### Chapter 12 — Rust harness engineering

**Core reading**

- `S052` [rmcp — official Rust MCP SDK](https://github.com/modelcontextprotocol/rust-sdk/blob/main/crates/rmcp/README.md) — modelcontextprotocol · `egress-403`
- `S053` [rig-core](https://docs.rs/rig-core) — Rig
- `S054` [The Typestate Pattern in Rust](https://cliffle.com/blog/rust-typestate/) — Cliffle
- `S055` [Typestate Programming](https://docs.rust-embedded.org/book/static-guarantees/typestate-programming.html) — The Embedded Rust Book · `unchecked`
- `S056` [How to Implement State Machines in Rust](https://oneuptime.com/blog/post/2026-02-01-rust-state-machines/view) — OneUptime · `unchecked`
- `S057` [Building AI Agents from Scratch in Rust](https://rustify.rs/articles/rust-ai-agents-from-scratch-2026) — Rustify · `unchecked`

**Going deeper**

- `S058` [Building MCP Servers in Rust](https://rustify.rs/articles/rust-for-mcp-model-context-protocol-servers-2026) — Rustify · `unchecked`
- `S059` [Rust-Native AI Agent Frameworks: Architecture, Performance, Ecosystem](https://zylos.ai/research/2026-04-01-rust-native-ai-agent-frameworks-ecosystem-2026/) — Zylos Research · `unchecked`
- `S060` [typestate-builder](https://docs.rs/typestate-builder/latest/typestate_builder/) — docs.rs · `unchecked`

