# Research log — pass 03 (2026-08-28)

A build pass more than a research pass. Four queries; most of the work was making
the reference harness and proving it correct.

## Queries

| # | Query | Gap |
|---|---|---|
| 1 | `A2A agent-to-agent protocol specification multi-agent communication interoperability 2026` | #5 protocols |
| 2 | `semantics-aware checkpoint restore agent recovery correctness chat-only baseline paper` | #3 unsourced number |
| 3 | `"Meta Context Engineering" SWE-bench Verified 89.1 context assembly optimization paper` | #2 unsourced number |
| 4 | (fetch) `cliffle.com/blog/rust-typestate` | #1 Ch.12 depth |

Queries 2 and 3 existed only because pass 02 wrote the unsourced numbers down
instead of using them. Both resolved on the first query. **Recording an
unverifiable claim as an open item, rather than citing it or forgetting it, is
what made this pass cheap.**

## Findings

### Crab (query 2 → Ch.6 core reading)

*Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes*
(arXiv 2604.28138, Wu et al., Apr 2026). Recovery **correctness** on Terminal-Bench:

| Approach | Correctness |
|---|---|
| chat-only | 8–13% |
| chat + filesystem | 28–42% |
| semantics-aware C/R | 100% |

Framing worth keeping: application-level recovery preserves chat history but
misses OS-side effects; full per-turn checkpointing is correct but too expensive
under dense co-location. The interesting design space is between them.

The 8–13% figure is now the strongest single argument in Ch.6, because
"preserve the conversation and resume" is exactly what most harnesses do.

### Meta Context Engineering (query 3 → Ch.4 going deeper)

*Meta Context Engineering via Agentic Skill Evolution* (arXiv 2601.21557, Ye et
al., ICML 2026). Bi-level: a meta-agent evolves context-engineering skills via
"agentic crossover" while a base agent applies them.

**The pass-01 snippet was misleading.** It reported "89.1% on SWE-bench Verified
vs 70.7% for hand-engineered baselines." The paper's own headline claim is
5.6–53.8% relative improvement over agentic CE methods, mean 16.9%. Ch.4 cites
the paper's numbers. This is the whole case for the no-citing-from-snippets rule.

### A2A and interoperability (query 1 → Ch.3 section)

A2A: v1.0 in 2026, Linux Foundation governance since June 2025, Google-initiated
with 50+ partners. **Agent Cards** advertise capability and secure invocation;
async over HTTP + SSE so long tasks don't block callers. Three-role model: user,
client agent, remote agent.

Note how much of the design is forced by the same constraints as Ch.6 —
long-running tasks, callbacks over blocking, traceability for audit. That is the
reason it earned a section rather than a mention.

Also: the four-protocol survey (2505.02279) and, more useful, *Governance Gaps in
Agent Interoperability Protocols* (2606.31498) — what these protocols **cannot**
express. Ch.3 recommends the critical one over the descriptive one.

Deliberate framing in the chapter: cross-org interop is a premature abstraction
for most systems. When one team owns every node, a function call is a better edge
than a protocol.

### Incidental find

*From Question Answering to Task Completion: A Survey on Agent System and Harness
Design* (arXiv 2606.20683) appeared in query 3's results, unrelated to the query.
Broadest academic survey of the area; did not surface in two passes of direct
searching. → Ch.1 *Going deeper*.

**Third pass, third time an incidental result beat a targeted one.** Pass 01 got
its canon from an awesome-list's citations, pass 02 got its best find from a
follow-up query, pass 03 got a survey from an unrelated search.

## The reference harness

The main deliverable. `reference-harness/harness.ts`, ~260 lines, zero
dependencies, runs offline.

**Verified, not asserted.** `verify.sh` makes 8 assertions, each mapped to a
chapter claim: the loop reaches a stopping condition; no-progress detection fires
on repeated identical calls; the step budget bounds an unbounded task; a resumed
run resumes rather than restarts; it completes the call the crash interrupted;
post-crash side effects match a clean run exactly; no effect is applied twice;
every request has exactly one outcome and the log brackets the run. 8/8.

### The bug

The first version passed a crash test and was wrong.

```
crash at step 3  →  tool_requested logged, effect never applied
resume           →  state.step == 3, model asked for a NEW decision
                 →  the interrupted write_note silently dropped
                 →  run reports success, one of two notes missing
```

No error. Healthy-looking log. The only symptom was a missing line in a file
nobody was diffing.

Fix: `State.pending` tracks a request with no outcome; the loop completes it
before consulting the model. `verify.sh` now compares post-crash side effects to a
clean run byte for byte, which is the assertion that would have caught it.

Kept and documented rather than quietly fixed, because it teaches three things at
once: the append-before-effect window Ch.6 warns about, the Ch.8 point that "did
it resume?" is verification theater, and the repo's own rule that you verify by
running rather than by reasoning.

## Validation

- `check-links.sh`: 95 sources, **84 OK / 11 WARN / 0 FAIL**
- `check-coverage.sh`: passing
- `reference-harness/verify.sh`: **8/8**
