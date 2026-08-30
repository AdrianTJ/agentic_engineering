# Chapter 9 — Security, sandboxing & permissions

> **Core question:** Your agent runs for nine hours, unattended, with shell
> access, reading content it did not write. What is the blast radius?

## The problem

Long horizons make every security property worse. The agent runs unattended, so
nobody catches the bad step. It runs long, so it accumulates capability and
touches more systems. And it reads external content, whether web pages, issue
comments, file contents, or tool responses, any of which may contain
instructions. The model cannot reliably distinguish data it was asked to
process from instructions it was asked to follow. That failure is prompt
injection, and it is not a bug awaiting a patch. It is a structural property of
putting untrusted text into the same channel as instructions.

The consequence is that harness security cannot amount to making the model
refuse. Prompt-level defenses are mitigation rather than containment. The
load-bearing defenses are all architectural, and they are ordinary security
engineering: least privilege, isolation at the operating-system level,
allow-lists, and human approval gates sized to blast radius.

The chapter's sharpest single fact comes from the MCP literature. Roots, the
client's declaration of which directories a server may access, is a
coordination mechanism rather than a security control. Real isolation requires
sandboxing at the operating-system level, and every harness that treats a
declared boundary as an enforced one has this bug.

## Core reading

**1. [Understanding Model Context Protocol (MCP) security](https://www.wiz.io/academy/ai-security/model-context-protocol-security)** — Wiz · ~30 min
The clearest practitioner treatment of the MCP threat model, covering servers
as independent operating-system processes, the trust boundaries between host,
client, and server, and where each boundary actually gets enforced. Read it
alongside the spec from Chapter 5, and mind the gap between what the protocol
coordinates and what the operating system enforces.

**2. [Securing the AI Agent Revolution: A Practical Guide to MCP Security](https://www.coalitionforsecureai.org/securing-the-ai-agent-revolution-a-practical-guide-to-mcp-security/)** — Coalition for Secure AI · ~35 min
The full [MCP Security whitepaper](https://www.coalitionforsecureai.org/wp-content/uploads/2026/03/model-context-protocol-security-1.pdf)
is the primary artifact, with twelve threat categories spanning roughly forty
distinct threats; the article is the readable entry point.

Their framing of why this is not ordinary API security is the sentence to
keep. A model sits between user intent and system action, so an agent can be
talked into bypassing a control that no request would have been allowed to
bypass, and neither firewalls nor tokens model that.

The paper makes one unambiguous recommendation: perform token exchange at
every trust boundary, and never pass through a token received from an upstream
caller. That is the concrete defense against the confused-deputy problem
below, and most harnesses violate it by default.

The rest is the controls catalogue, and it is the one to steal from. The
baseline it argues for puts every MCP server in a container or VM with strict
isolation, makes filesystems read-only by default, restricts network access to
an allow-list of approved endpoints, applies resource quotas to contain abuse,
and places a gateway between agent and server that can inspect and transform
traffic, redacting personal data before it reaches the agent and sanitizing
tool responses to strip injection attempts. The gateway deserves particular
attention, because it is the only control in the list that addresses injection
at the point of ingestion, which is the right place.

**3. [The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)** — the sandbox section · ~10 min re-read
This gives the design view rather than the threat view: sandboxes as isolated
environments for code execution, with network isolation and command
allow-lists tightening the boundary. The point that is easy to miss on a first
read is that sandboxes are also a scaling primitive. They are created on
demand, fanned out across parallel tasks, and torn down afterward, and that is
what makes the parallelism of Chapter 3 safe.

**4. [Securing the Model Context Protocol: Risks, Controls, and Governance](https://arxiv.org/abs/2511.20920)** · ~40 min
The systematic version, with a threat taxonomy and a controls mapping. Read it
for completeness of the risk enumeration, because it covers categories the
practitioner guides skip.

**5. [The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)** — Simon Willison · ~10 min
Short, and the origin of the term used throughout this chapter. The three legs
are access to private data, exposure to untrusted content, and the ability to
communicate externally, and the recommendation is deliberately blunt: avoid
combining all three. Willison's argument for that severity is that guardrails
and detection cannot be relied on, since a 95 percent block rate is a failure
rate in security terms, and that no vendor can protect a user who assembles
the trifecta from tools bought separately. Read it as the strongest available
case that this is an architecture problem rather than a filtering problem.

**6. [Towards Secure Agent Skills: Architecture, Threat Taxonomy, and Security Analysis](https://arxiv.org/abs/2604.02837)** · ~30 min
Skills are instructions loaded at runtime from files, often written by third
parties, and that makes them a supply chain with all the properties of one.
Pair this with Fowler's
[*Coding Assistants Threaten the Software Supply Chain*](https://martinfowler.com/articles/exploring-gen-ai/software-supply-chain-attack-surface.html),
which makes the same argument about generated code and its dependencies.

**7. [Defeating Prompt Injections by Design (CaMeL)](https://arxiv.org/abs/2503.18813)** — Debenedetti et al., Google DeepMind · ~45 min
This is the strongest architectural answer anyone has proposed, and the design
the reference harness imitates for this chapter. The move is to extract
control and data flow from the trusted query, so that untrusted data can never
influence program flow, and to attach capability metadata to values so that
unauthorized data flows are blocked by a custom interpreter. The model
proposes, and a deterministic engine outside it decides, with no modification
to the model itself. It solves 67 percent of
[AgentDojo](https://agentdojo.spylab.ai/) tasks with provable security, and
"provable" is doing more work in that sentence than the number is.
[Simon Willison's write-up](https://simonwillison.net/2025/Apr/11/camel/) is
the best short explanation.

Read it alongside an uncomfortable fact. As of 2026, no production-grade CaMeL
implementation exists, and no mainstream agent harness has adopted the
pattern, so the best-understood defense in the field is not deployed in the
tools you use. Whether that is a gap in the research or in the industry is a
question worth forming an opinion about.

**8. [Before the Tool Call: Deterministic Pre-Action Authorization for Autonomous AI Agents](https://arxiv.org/abs/2603.20953)** · ~30 min
The implementable version, built on a four-layer architecture worth
memorizing: model alignment, deterministic pre-action authorization, sandboxed
execution, and post-hoc evaluation. Only the middle two are controls, while
the outer two are mitigations. Note the argument for intent-based
authorization over role-based access control. Roles cannot describe a dynamic
workflow, and a dynamic workflow is what an agent is.

## Going deeper

- **[AgentBound: Securing Execution Boundaries of AI Agents](https://arxiv.org/abs/2510.21236)** covers enforcement mechanisms at the boundary.
- **[The Balkanization of Execution-Security Research for AI Coding Agents](https://arxiv.org/abs/2607.05743)** surveys isolation, access control, and time-of-check-to-time-of-use vulnerabilities. The TOCTTOU section is the one most likely to describe a bug you actually have.
- **[Inside the lethal trifecta: blast radius reduction in AI agent deployments](https://www.sophos.com/en-us/blog/inside-the-lethal-trifecta-blast-radius-reduction-in-ai-agent-deployments)**, from Sophos, gives seven operational patterns on an explicit assume-breach footing rather than an injection-prevention one. Two of them are underrepresented everywhere else in this chapter. Credential isolation resolves and injects secrets in a separate process or proxy so they never enter the model's context at all, which removes a target rather than guarding it. Sealed tool endpoints put fixed-schema tools behind a broker that holds the credentials and enforces per-tool egress allow-lists. The piece also recommends splitting one do-everything agent into narrower identities for retrieval, planning, execution, and approval-sensitive actions.
- **[Give Them an Inch and They Will Take a Mile: Caller Identity Confusion in MCP-Based AI Systems](https://arxiv.org/abs/2603.07473)** documents a specific, measured, and genuinely surprising class of MCP vulnerability. Read it as a case study in how protocol-level ambiguity becomes an exploit.
- **[Deep Dive: 12 Reusable Agentic Harness Design Patterns](https://www.epsilla.com/blogs/2026-04-18-deep-dive-12-reusable-agentic-harness-design-patte)** describes the blast-radius pattern: evaluate the blast radius of each proposed action and require human approval above a threshold. It is third-party inference about a shipping harness, but the pattern stands on its own.
- **[12-Factor Agents](https://github.com/humanlayer/12-factor-agents)**, factor 7, contact humans with tool calls, is the mechanism that makes approval gates composable rather than special-cased.

## Key concepts

**Blast radius.** The worst outcome of a single action, and the right unit for
sizing approval gates. Gate on radius rather than on tool identity.

**Prompt injection.** Instructions arriving as data. Structural rather than
patchable, so assume it and contain it.

**Lethal trifecta.** Private data access, untrusted content, and external
communication, per [Simon Willison, 2025](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/).
Any two are usually survivable. All three together is exfiltration waiting to
happen, so audit every agent against it.

**Confused deputy, or identity confusion.** The agent acting with its own
privileges on behalf of a caller who lacks them.

**Token exchange at trust boundaries.** Never forward an upstream caller's
token downstream; exchange it for one scoped to the next hop. The single
highest-value control against the confused deputy.

**Least privilege, per task.** Credentials scoped to the task at hand rather
than to the agent forever.

**Isolation at the operating-system level.** A container or a VM. The only
real boundary.

**Allow-list over deny-list.** For network egress and commands alike, because
deny-lists lose.

**Roots are not enforcement.** A declared boundary, and coordination only.

**Gateway, or broker.** An interception point for inspection, redaction, and
response sanitization.

**Credential isolation.** Secrets resolved and injected outside the model's
context, so that a compromised context has nothing to leak. This removes the
target rather than guarding it.

**Pre-action authorization.** A deterministic decision made before the effect,
by code the model cannot influence. The model proposes; the engine decides.

**Approval as a budget.** An approval authorizes N executions rather than
acting as a predicate, because a boolean approval is a standing permit.

**Human-in-the-loop gate.** Approval sized to blast radius, implemented as a
durable wait in Chapter 6's sense rather than a blocking prompt.

**Skill and MCP server supply chain.** Third-party instructions and code
loaded at runtime. Pin them, review them, and attribute them.

## Build this

Threat-model the harness you have built across Chapters 2 through 8, then fix
the worst thing you find.

[`reference-harness/`](../reference-harness/) works this seam with a
deterministic `authorize()` outside the model, a blast radius per tool,
per-value provenance that closes egress for payloads derived from untrusted
content, and approval as a durable wait. Running `POLICY_OFF=1` on the
identical script lets the data leave, which is how its `verify.sh` proves the
control is load-bearing rather than decorative. Its README also documents the
finding that an approval is a budget rather than a predicate. Keyed by
occurrence it spams the human, keyed logically it becomes a standing permit,
and the fix is a use count kept on a separate ledger from idempotency.

The harness also makes step 3 concrete, and the distinction involved is the
one this chapter most wants you to hold:

```sh
SCRIPT=escape node harness.ts        # the POLICY permits it → file written outside the workspace
./run-sandboxed.sh SCRIPT=escape     # the RUNTIME blocks it → nothing written
```

The escaping tool is classified as a plain `write` on purpose, so
authorization passes it, and only containment stops it. If your whole security
story is a policy function, the first command is your security story.

1. Enumerate. List every capability, covering shell, filesystem paths, network
   destinations, credentials, and external side effects, and for each one
   write down the worst single action.
2. Run the trifecta audit. Does this agent have private data access, untrusted
   content ingestion, and external communication? If it has all three,
   document the exfiltration path concretely, end to end, and do not skip this
   because it feels theoretical.
3. Contain. Move execution into a container, make the filesystem read-only
   except for one working directory, and restrict network egress to an
   explicit allow-list. Then verify the containment by attempting to breach
   it, because an untested boundary is a claim.
4. Gate. Classify actions by blast radius and require approval above a
   threshold, implementing approval as a tool call in the factor 7 style that
   resolves to a durable wait in the Chapter 6 style.
5. Inject. Plant a prompt injection in content your agent will read, whether a
   file, a web page, or a tool response, instructing it to exfiltrate
   something benign to a local endpoint, and run it. Whatever happens, you
   have learned something. If the injection succeeds, note which control would
   have stopped it, and add that one.
6. Write the result into your Chapter 1 harness inventory as a section on what
   this harness permits.

## Check yourself

1. Why can prompt injection not be fixed at the prompt level? State the structural reason.
2. Name the lethal trifecta, and give a real agent configuration that has all three legs.
3. Roots as against a container: what does each guarantee, and what does each not?
4. Design an approval policy by blast radius for a coding agent with shell access. Where is the threshold, and what is the argument for it?
5. Your agent reads GitHub issue comments. Trace an end-to-end attack from a comment to an exfiltrated secret, naming every hop.
6. Why is an allow-list the right shape for network egress, and what makes a deny-list fail here specifically?
7. A third-party skill is one markdown file. What review does it need before you load it, and what would you automate?
8. Your harness forwards the user's OAuth token to every MCP server it talks to. Name the attack this enables, and describe the token-exchange design that closes it.
