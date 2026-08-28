# Exit assessment

*Check yourself* questions at the end of each chapter have no answer key, on
purpose: most of them have several defensible answers, and a key would turn a
thinking exercise into a recall one.

This is the substitute, and it is a better test anyway. Each chapter gets **one
task against the reference harness** with an objective pass condition. You either
did it or you didn't, and the harness tells you which.

Work them in order. Each assumes the previous ones are done — by the end you have
built most of a real harness, which is the point.

Six chapters are already implemented in the harness (Ch.2, 3, 4, 6, 7, 9), so
those tasks ask you to go **past** what is there rather than rebuild it. Three of
them point at questions this curriculum has not answered: they are open, and a
clean result belongs upstream rather than in your notes.

> Setup: `cd harness-engineering/reference-harness && node harness.ts`
> Baseline: `./verify.sh` should pass against `baseline.json` before you change
> anything. Current figures: `MEASUREMENTS.md` (generated — never quote prose for
> a number).

---

### Ch.1 — Foundations

**Task.** Write the harness inventory for the reference harness: for each of
LangChain's six primitives (filesystem, code execution, sandbox, memory & search,
context management, planning & verification), name the mechanism or write "none."

**Pass condition.** You identified at least three "none"s and, for each, named the
long-horizon failure its absence produces. If you wrote a mechanism for *sandbox*,
re-read the code — there isn't one, and that is Ch.9's problem.

---

### Ch.2 — The loop

**Task.** Add a fifth stopping condition: **wall-clock budget**. Then construct a
task that trips it and nothing else.

**Pass condition.** `verify.sh` still passes 15/15, and your new condition fires
without the step or token budget firing first. If you can't separate them, your
budgets are redundant — which is itself the finding.

---

### Ch.3 — Graphs & control flow

**Task.** `route()` already makes one edge static, and its README warns that a
sequential scan is the most routable case that exists. So: **find where routing
stops paying.** Add a second rule for a case that is *nearly* enumerable, and
measure it.

**Pass condition.** Either a second rule that saves model calls without changing
behaviour, or a written account of the rule you tried, what it got wrong, and what
you would have had to enumerate to make it safe. The negative result is the more
valuable pass, and harder to write honestly.

---

### Ch.4 — Context & memory

**Task.** Reproduce the four-policy measurement, then **beat it**. Add a fifth
policy that bills less than `compact` (currently the cheapest) without exceeding
100% occupancy.

Read the current numbers from `reference-harness/MEASUREMENTS.md` rather than from
any prose — including this file. The published figures have gone stale twice as
the harness grew, which is why that file is generated.

**Pass condition.** A measured billed figure below `compact`'s, and a paragraph on
what you traded. "I dropped the notes" is legitimate if you can say what it costs.

---

### Ch.5 — Tools & definitions

**Task.** Add five tools with realistic descriptions. Record the `tools` row of
the context report before and after. Then halve that number without removing
capability.

**Pass condition.** Same capability, roughly half the fixed token cost, and you
can name which technique bought each saving — consolidation, namespacing, or
progressive disclosure.

---

### Ch.6 — State, durability, resumption

**Task.** Find a crash point that still breaks the harness. `CRASH_AT` fires at a
step boundary; the interesting windows are narrower than that.

**Pass condition.** Either a reproducible divergence between a crashed-and-resumed
run and a clean one — in which case write the `verify.sh` assertion that catches
it — or a written argument for why no such window remains. Both are passes. The
second is harder.

---

### Ch.7 — Cost, caching & economics

**Task.** Cache accounting exists, and it produced a result the curriculum has
**not settled**: compaction bills less than tool clearing, but the model is
*block-granular* — any change invalidates a whole block — while real providers
cache at token-prefix granularity.

That question has since been **answered** (`CACHE_MODEL=chunk`): the ordering
survives, but the margin between doing nothing and compacting collapses from 3.4×
to 1.04×. See `MEASUREMENTS.md`.

So the task is now the next question down. A 40-char chunker is not a tokenizer;
real boundaries fall elsewhere, and a real provider's cache has minimum block
sizes and TTLs the harness ignores. **Redo the comparison against a real
tokenizer, or against actual provider cache telemetry.**

**Pass condition.** A measured answer with its assumptions stated: does 1.04%
survive contact with a real tokenizer? If your result is clean it belongs upstream
in this repository, not in your notes — that is the standard the curriculum holds
itself to, twice now.

---

### Ch.8 — Verification, evals & observability

**Task.** Turn `verify.sh` into a proper regression suite: emit structured results
rather than printed lines, commit a baseline, and make a change that moves a
number.

**Pass condition.** You can answer "did this change help?" with a diff of two
runs, not an opinion. Bonus: your change made things *worse* and you kept the
record.

---

### Ch.9 — Security, sandboxing & permissions

**Task.** Blast-radius classification, an approval gate, and runtime containment
all exist. What does not exist is a defence against **laundering**: `SCRIPT=launder`
paraphrases untrusted content and walks it straight past the substring check, and
`verify.sh` asserts that it does.

Close it, or prove you can't. Then go further than the harness does: it uses
Node's permission model, which is a *runtime* boundary. Put it in a container and
bound CPU, memory and network too.

**Pass condition.** Either a check that catches laundering without an unacceptable
false-positive rate — measured, on both the `launder` and `benign` scripts — or a
written argument for why payload inspection cannot work and what CaMeL's
interpreter does instead. Plus a containment boundary you **tried to breach**. An
untested boundary is a claim, not a control; if you didn't attempt the breach, you
haven't passed.

---

### Ch.10 — Long-running operations & the human interface

**Task.** Implement `HANDOFF.md` per the schema in `SPEC.md`, plus a context
*reset* that clears the window and restarts from the handoff alone.

**Pass condition.** A run that resets mid-task completes correctly, and
`verify.sh` proves its output matches a no-reset run. Then compare reset against
compaction on the Ch.4 measurement — you now have four policies and a real
opinion about which suits which task.

---

### Ch.11 — TypeScript

**Task.** Replace `ModelProvider.decide` with a real SDK call. Run `verify.sh`.

**Pass condition.** You can say which assertions became flaky and why. Determinism
was doing more work in this suite than it looked like, and finding out exactly how
much is the lesson.

---

### Ch.12 — Rust

**Task.** Reimplement the three tools as an `rmcp` server in Rust, deriving JSON
Schema from Rust types. Point the TypeScript harness at it over stdio.

**Pass condition.** The same `verify.sh` passes against the Rust tool server, with
no hand-written schema anywhere. You now have the polyglot shape most production
systems converge on.

---

## The real exit condition

You have finished this curriculum when you can do the thing Ch.8 asks for:
**change the harness, and prove what the change did.**

Not "I read the sources." Not "I built a harness." A recorded before/after on a
regression suite, including at least one change that made things worse and which
you kept in the log.

That is the whole discipline. Everything else here is preparation for it.
