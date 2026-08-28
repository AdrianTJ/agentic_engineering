# Exit assessment

*Check yourself* questions at the end of each chapter have no answer key, on
purpose: most of them have several defensible answers, and a key would turn a
thinking exercise into a recall one.

This is the substitute, and it is a better test anyway. Each chapter gets **one
task against the reference harness** with an objective pass condition. You either
did it or you didn't, and the harness tells you which.

Work them in order. Each assumes the previous ones are done — by the end you have
built most of a real harness, which is the point.

> Setup: `cd harness-engineering/reference-harness && node harness.ts`
> Baseline: `./verify.sh` should report 15/15 before you change anything.

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

**Task.** The harness has exactly one dynamic edge: the model choosing a tool.
Add a **static** router that sends any `args` matching `*.md` to a dedicated
markdown path without consulting the model, and measure the token saving.

**Pass condition.** Fewer model calls for the same completed work, with the
routing decision visible in the event log. Then answer: what did you give up?

---

### Ch.4 — Context & memory

**Task.** Reproduce the three-policy measurement, then **beat it**. Add a fourth
policy that gets below `full`'s 3,570 billed tokens without exceeding 100%
occupancy.

**Pass condition.** A measured number lower than 3,570, and a one-paragraph
account of what you traded to get it. "I dropped the notes" is a legitimate answer
if you can say what it costs.

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

**Task.** Add cache accounting: mark the stable prefix, and report which context
blocks would survive as a cache hit versus be invalidated, per turn.

**Pass condition.** Your report shows compaction invalidating the prefix, and you
can state the break-even — how many turns of cache hits a compaction has to save
to pay for the invalidation it causes.

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

**Task.** The harness has no sandbox: `write_note` appends to the filesystem with
whatever privileges the process has. Classify all tools by blast radius, gate the
high-radius ones behind approval, and containerize execution.

**Pass condition.** An approval gate that fires on the right tools, and a
containment boundary you tried to breach. **An untested boundary is a claim, not a
control** — if you didn't attempt the breach, you haven't passed.

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
