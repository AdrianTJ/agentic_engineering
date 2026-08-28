# Chapter 9 — Security, sandboxing & permissions

> **Core question:** Your agent runs for nine hours, unattended, with shell access,
> reading content it did not write. What is the blast radius?

## The problem

Long horizons make every security property worse. The agent runs unattended, so
nobody catches the bad step. It runs long, so it accumulates capability and touches
more systems. It reads external content — web pages, issue comments, file contents,
tool responses — any of which may contain instructions, and the model cannot
reliably distinguish data it was asked to process from instructions it was asked to
follow. That is **prompt injection**, and it is not a bug to be patched; it is a
structural property of putting untrusted text into the same channel as instructions.

The consequence is that harness security cannot be "make the model refuse."
Prompt-level defenses are mitigation, not containment. The load-bearing defenses
are all architectural, and they are ordinary security engineering: least privilege,
OS-level isolation, allow-lists, and human approval gates sized to blast radius.

The chapter's sharpest single fact, from the MCP literature: **Roots — the client's
declaration of which directories a server may access — is a coordination
mechanism, not a security control.** Real isolation requires OS-level sandboxing.
Every harness that treats a declared boundary as an enforced one has this bug.

## Core reading

**1. [Understanding Model Context Protocol (MCP) security](https://www.wiz.io/academy/ai-security/model-context-protocol-security)** — Wiz · ~30 min
The clearest practitioner treatment of the MCP threat model. Servers as independent
OS processes, the trust boundaries between host, client, and server, and where
each one actually gets enforced. Read alongside the spec from Ch.5 and note the
gap between what the protocol *coordinates* and what the OS *enforces*.

**2. [Securing the AI Agent Revolution: A Practical Guide to MCP Security](https://www.coalitionforsecureai.org/securing-the-ai-agent-revolution-a-practical-guide-to-mcp-security/)** — Coalition for Secure AI · ~35 min
(The full [MCP Security whitepaper](https://www.coalitionforsecureai.org/wp-content/uploads/2026/03/model-context-protocol-security-1.pdf) is the primary artifact: 12 threat categories spanning roughly 40 distinct threats. The article is the readable entry point.)

Their framing of why this is not ordinary API security is the sentence to keep:
an LLM sits between user intent and system action, so an agent can be talked into
bypassing a control that no request would have been allowed to bypass. Firewalls
and tokens do not model that.

The one unambiguous recommendation in the paper: **perform token exchange at every
trust boundary, and never pass through a token received from an upstream caller.**
That is the concrete defense against the confused-deputy problem below, and most
harnesses violate it by default.

The controls catalogue is the rest, and the one to steal from. The baseline it argues for:
every MCP server in a container or VM with strict isolation; read-only filesystems
by default; network access restricted to an allow-list of approved endpoints;
resource quotas to contain abuse; and a gateway between agent and server that can
inspect and transform traffic — redacting PII before it reaches the agent and
sanitizing tool responses to strip injection attempts. Note that the gateway is
the only control in the list that addresses injection *at the point of ingestion*,
which is the right place.

**3. [The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)** — the sandbox section · ~10 min re-read
The design view rather than the threat view: sandboxes as isolated environments
for code execution, with network isolation and command allow-lists tightening the
boundary. The point easy to miss on a first read is that sandboxes are also a
*scaling* primitive — created on demand, fanned out across parallel tasks, torn
down after — which is what makes the parallelism of Ch.3 safe.

**4. [Securing the Model Context Protocol: Risks, Controls, and Governance](https://arxiv.org/abs/2511.20920)** · ~40 min
The systematic version: a threat taxonomy and a controls mapping. Read for
completeness of the risk enumeration; you will find categories the practitioner
guides skip.

**5. [The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)** — Simon Willison · ~10 min
Short, and the origin of the term used throughout this chapter. Private data
access, exposure to untrusted content, and the ability to communicate externally.
The recommendation is deliberately blunt and worth taking seriously before you
reach for a clever mitigation: **avoid combining all three.** Willison's argument
for that severity is that guardrails and detection cannot be relied on — a 95%
block rate is a failure rate in security — and that no vendor can protect a user
who assembles the trifecta from tools bought separately. Read it as the strongest
available case that this is an architecture problem, not a filtering problem.

**6. [Towards Secure Agent Skills: Architecture, Threat Taxonomy, and Security Analysis](https://arxiv.org/abs/2604.02837)** · ~30 min
Skills are instructions loaded at runtime from files, often from third parties.
That is a supply chain, with all the properties of one. Pair with Fowler's
[*Coding Assistants Threaten the Software Supply Chain*](https://martinfowler.com/articles/exploring-gen-ai/software-supply-chain-attack-surface.html) — the same argument about generated code and its dependencies.

## Going deeper

- **[AgentBound: Securing Execution Boundaries of AI Agents](https://arxiv.org/abs/2510.21236)** — enforcement mechanisms at the boundary.
- **[Give Them an Inch and They Will Take a Mile: Caller Identity Confusion in MCP-Based AI Systems](https://arxiv.org/abs/2603.07473)** — a specific, measured, and genuinely surprising class of MCP vulnerability. Read it as a case study in how protocol-level ambiguity becomes an exploit.
- **[Deep Dive: 12 Reusable Agentic Harness Design Patterns](https://www.epsilla.com/blogs/2026-04-18-deep-dive-12-reusable-agentic-harness-design-patte)** — the blast-radius/HITL pattern: evaluate the blast radius of each proposed action and require human approval above a threshold. Third-party inference about a shipping harness, but the pattern stands on its own.
- **[12-Factor Agents](https://github.com/humanlayer/12-factor-agents)** #7, *contact humans with tool calls* — the mechanism that makes approval gates composable rather than special-cased.

## Key concepts

- **Blast radius** — the worst outcome of a single action. The right unit for sizing approval gates: gate on radius, not on tool identity.
- **Prompt injection** — instructions in data. Structural, not patchable. Assume it and contain it.
- **Lethal trifecta** — private data access + untrusted content + external communication ([Simon Willison, 2025](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)). Any two is usually survivable; all three is exfiltration waiting to happen. Audit every agent against it.
- **Confused deputy / identity confusion** — the agent acting with its own privileges on behalf of a caller who lacks them.
- **Token exchange at trust boundaries** — never forward an upstream caller's token downstream; exchange it for one scoped to the next hop. The single highest-value control against the confused deputy.
- **Least privilege, per-task** — credentials scoped to the task at hand, not to the agent forever.
- **OS-level isolation** — container or VM. The only real boundary.
- **Allow-list over deny-list** — for both network egress and commands. Deny-lists lose.
- **Roots ≠ enforcement** — declared boundary, coordination only.
- **Gateway / broker** — an interception point for inspection, redaction, and response sanitization.
- **Human-in-the-loop gate** — approval sized to blast radius; a durable wait (Ch.6), not a blocking prompt.
- **Skill / MCP server supply chain** — third-party instructions and code loaded at runtime. Pin, review, and attribute.

## Build this

Threat-model the harness you have built across Chapters 2–8, then fix the worst thing.

1. **Enumerate.** List every capability: shell, filesystem paths, network destinations,
   credentials, external side effects. For each, write the worst single action.
2. **Trifecta audit.** Does this agent have private data access, untrusted content
   ingestion, and external communication? If all three, document the exfiltration
   path concretely, end to end. Do not skip this because it feels theoretical.
3. **Contain.** Move execution into a container. Filesystem read-only except one
   working directory. Network egress restricted to an explicit allow-list. Verify
   containment by *attempting* to breach it — an untested boundary is a claim.
4. **Gate.** Classify actions by blast radius and require approval above a threshold.
   Implement approval as a tool call (12-factor #7) resolving to a durable wait (Ch.6).
5. **Inject.** Plant a prompt injection in content your agent will read — a file, a
   web page, a tool response — instructing it to exfiltrate something benign to a
   local endpoint. Run it. Whatever happens, you have learned something; if the
   injection succeeds, note *which* control would have stopped it and add that one.
6. Write the result into your Ch.1 harness inventory as a "what this harness
   permits" section.

## Check yourself

1. Why can't prompt injection be fixed at the prompt level? State the structural reason.
2. Name the lethal trifecta and give a real agent configuration that has all three.
3. Roots vs. a container: what does each guarantee, and what does each not?
4. Design an approval policy by blast radius for a coding agent with shell access. Where's the threshold, and what's the argument for it?
5. Your agent reads GitHub issue comments. Trace an end-to-end attack from a comment to an exfiltrated secret, naming every hop.
6. Why is an allow-list the right shape for network egress, and what makes a deny-list fail here specifically?
7. A third-party skill is one markdown file. What review does it need before you load it, and what would you automate?
8. Your harness forwards the user's OAuth token to every MCP server it talks to. Name the attack this enables, and describe the token-exchange design that closes it.
