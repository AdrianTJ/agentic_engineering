# Research log — pass 02 (2026-08-28)

Gap-driven pass. Unlike pass 01's breadth-first sweep, every query here targeted a
specific open item from `PROVENANCE.md`.

## Queries and what each was for

| # | Query | Gap targeted |
|---|---|---|
| 1 | `Simon Willison lethal trifecta prompt injection private data exfiltration` | #4 attribution |
| 2 | `agent cost engineering token budget prompt caching model routing per step production` | #3 cost |
| 3 | `why use a graph framework for agents durability streaming human in the loop argument LangGraph defense` | #6 pro-framework |
| 4 | `human agent handoff long running task resuming supervising asynchronous coding agent ergonomics` | #7 handoff |
| 5 | `Anthropic engineering long-running agents generator evaluator loop handoff artifacts fail criteria` | #7 (follow-up) |
| 6 | `OpenAI "harness engineering" Codex blog February 2026 what it says principles summary` | #1 corroboration |
| 7 | `"Don't Break the Cache" prompt caching long-horizon agentic tasks evaluation findings` | #3 (follow-up) |
| 8 | `awesome-agentic-patterns nibzard agent design patterns catalog` | general index |

Queries 5 and 7 were follow-ups triggered by 4 and 2 — both of the highest value
in the pass. **The pattern holds from pass 01: the second query on a thread beats
the first, because the first tells you the right vocabulary.**

## Findings

### Attribution (gap 4 — closed)

Lethal trifecta: **Simon Willison, 16 June 2025**. The three components verbatim:
access to private data; exposure to untrusted content ("any mechanism by which
text or images controlled by a malicious attacker could become available to your
LLM"); external communication capability.

His recommendation is stronger than the secondary sources convey: *"the only way
to stay safe there is to avoid that lethal trifecta combination entirely."*
Reasoning: guardrails and detection cannot be relied on (a 95% success rate is a
failure rate in security), and no vendor can protect a user who assembles the
trifecta from independently-sourced tools. → Ch.9 core reading.

### Cost (gap 3 — became Ch.7)

**Don't Break the Cache** (arXiv 2601.06007), the anchor. Evaluates full-context,
system-prompt-only, and exclude-dynamic-tool-results caching across OpenAI,
Anthropic, and Google.
- 45–80% API cost reduction; 13–31% TTFT improvement.
- **Strategic cache-block control beats naive full-context caching, which can
  paradoxically *increase* latency.**
- Rules: dynamic content at the *end* of the system prompt; avoid dynamic function
  calling; exclude dynamic tool results from the cached region.
- Caching behavior varies by provider — strategy is not portable.

The realization that made this a chapter rather than a section: **rule 3 collides
with Ch.4.** Compaction, tool clearing, and JIT retrieval all mutate the context,
and mutation invalidates the cache. The techniques that save tokens can cost money
net. Nobody in the pass-01 sources mentions this.

Second collision: "avoid dynamic tool definitions" is a hidden cost of Ch.5's
progressive disclosure. Also unmentioned anywhere else.

Practitioner magnitudes (vendor sources, treated as rough): routing 60–80%,
caching 40–90% of input tokens, context optimization 30–60%. Budget controls —
soft alerts at 50%/80%, hard stop at 100% — are the unglamorous lever that
actually prevents a five-figure invoice from a looping bug.

### Pro-framework argument (gap 6 — closed)

**Building LangGraph: designing an agent runtime from first principles.** Derives
six required runtime features (parallelization, streaming, task queuing,
checkpointing, HITL, tracing) from three properties of agents (latency,
unreliability, non-determinism). Disposes of both neighbours: DAG frameworks can't
express the loop; durable execution engines (Temporal) predate LLM agents — no
streaming, inter-step latency, degradation as histories grow.

Concedes the opposing case explicitly: *"the biggest competitor to any code
framework is always no framework."* That concession is what makes it usable as the
other half of a real disagreement rather than a vendor pitch.

Best detail, worth stealing framework-agnostically: **a pause for a human is the
same primitive as a pause for a clock.** Checkpointing makes an interrupt a real
interruption — nothing held running — so approval "scales neither in time nor in
volume." → Ch.6, and it is what makes Ch.10's human interface affordable.

### Long-running operations (gap 7 — became Ch.10)

**Anthropic, *Harness design for long-running application development*** — the
find of the pass. Sections: why naive implementations fall short; making
subjective quality gradable; scaling to full-stack; iterating on the harness;
what comes next.

- **Context anxiety**: models lose coherence as the window fills and wrap up
  prematurely. Distinct from context rot — it's the *behavioral response* to it.
- **Context resets over compaction** for long tasks: clear the window entirely,
  hand off through structured artifacts. Directly contradicts Ch.4's approach.
- **Generator/evaluator**, GAN-shaped, motivated by self-grading: an agent asked
  to judge its own work "confidently praises it — even when the quality is
  obviously mediocre."
- **Sprint contract**: generator and evaluator agree what "done" means *before* the
  work. Hard fail thresholds; below threshold fails the sprint with specific feedback.
- **The ending is the best part**: a later model handled the work without the sprint
  decomposition, so they removed it. Harness complexity is a function of model
  capability and should be re-litigated.

Corroboration from independent teams (Addy Osmani's survey): *"state lives outside
the agent's context"* — plan files, progress files, structured handoffs, generation
separated from evaluation, a loop that refuses to let the agent stop early. Cursor
does planners/workers/judges; Google does it on Agent Platform. Three independent
convergences is the argument for these being real patterns rather than one team's
style.

Research infrastructure: asynchronous human–agent rollout over 30h+ runs, allowing
supervision *without interrupting* — non-blocking supervision, which almost nothing
implements and which is the property that makes these systems tolerable to use.

### OpenAI corroboration (gap 1 — closed)

Still 403 to every fetcher available here. Corroborated through InfoQ (200) and
several independent summaries, consistently reporting:
- ~1M lines over five months, zero hand-written.
- **"Context engineering asks what the agent should see, while harness engineering
  asks what the system should prevent, measure, and correct."** The best one-line
  statement of the discipline found in two passes; now the anchor quote in Ch.1.
- "Give Codex a map, not a 1,000-page instruction manual" — short `AGENTS.md`
  pointing at deeper sources of truth. This is Ch.5's progressive disclosure
  applied to documentation.
- Role inversion: humans steer and specify; agents execute.

Also surfaced a second OpenAI post: *Unlocking the Codex harness: how we built the
App Server* (same 403 caveat). → Ch.1 *Going deeper*.

## Validation

`check-links.sh`: 88 sources, **77 OK / 11 WARN / 0 FAIL**. `check-coverage.sh`: passing.

**One false FAIL, and the fix.** `augmentcode.com` returned `000` (connection-level
failure) on a 30s timeout, then 200 on three consecutive manual retries — it is
simply slow. The checker was hardened rather than the result accepted: 45s timeout,
one retry, retrying only on `000` (never on an HTTP status, which would mask a real
error). A validator that produces false failures gets ignored.

## Deliberately not used

- **"Chat-only recovery achieves 8–13% correctness vs. 100% for semantics-aware
  checkpoint/restore."** Appeared in a search snippet during query 4. It would be
  an excellent Ch.6 citation. No primary located, so it is recorded here and cited
  nowhere. → gap 3 for pass 03.
- **Meta Context Engineering, 89.1% vs 70.7% on SWE-bench Verified** (carried from
  pass 01). Still no primary. Same treatment.

Both are the kind of number that propagates through secondary sources unchecked.
Recording them here without using them is the point of keeping this log.
