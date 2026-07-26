---
name: make-pipeline
description: >
  Turn a working sequence of data commands into a reproducible, restartable
  pipeline with a Makefile. Use whenever an analysis has grown past two or three
  chained steps, needs to re-run after an input changes, or has to be handed to
  someone else and still produce the same numbers.
---

# Make pipeline

A pipeline is a dependency graph, not a script. Declaring which file each step
produces and which files it needs makes the work restartable, incrementally
re-runnable, and parallelizable for free — and makes "does this reproduce?"
answerable by `make` rather than by memory.

Reach for this the moment a shell-history sequence becomes something you'd have
to *remember* to re-run in order.

## Workflow

1. **Name the artifacts.** Write down the file each step produces:
   `raw/orders.json` → `clean/orders.csv` → `out/summary.csv` → `out/chart.png`.
   Every step's output is a real file on disk; that's what makes it resumable.
2. **Write one rule per artifact.** Target on the left, its inputs after the
   colon, the command underneath. The command must write exactly the target.
3. **Order nothing by hand.** Make derives execution order from the dependency
   graph. If you find yourself numbering steps, the dependencies are wrong.
4. **Make it re-runnable.** Re-running with no input changes must do nothing
   ("up to date"); touching an input must rebuild only what depends on it.
   Verify both before trusting the pipeline.
5. **Keep raw immutable.** No rule may modify a file under `raw/`. Downloads land
   there once; every later stage reads from it and writes elsewhere.
6. **Parallelize last.** `make -j4` comes free from the graph — but only after
   the serial run is verified correct (see `parallelize-pipeline`).

## Minimal shape

```make
.PHONY: all clean
all: out/summary.csv out/chart.png

raw/orders.json:
	mkdir -p raw && curl -fsS "$(API_URL)" -o $@

clean/orders.csv: raw/orders.json
	mkdir -p clean && jq -r '.results[] | [.id,.amount] | @csv' $< > $@

out/summary.csv: clean/orders.csv
	mkdir -p out && csvsql --query "SELECT COUNT(*) n, SUM(amount) total FROM orders" $< > $@

clean:
	rm -rf clean out          # never raw/ — that's the expensive, immutable input
```

`$@` is the target, `$<` the first prerequisite. **Recipe lines must be indented
with a TAB**, not spaces — a space-indented recipe fails with
`missing separator`, which is the single most common Make error.

## Guardrails

- A rule whose command doesn't actually create its target makes Make re-run it
  forever and silently breaks incremental builds. Confirm the filename matches.
- Don't put a slow download and a fast transform in one rule — you lose the
  ability to iterate on the transform without re-fetching.
- `clean` deletes derived data only. Deleting `raw/` means re-downloading, which
  may not even be reproducible if the source has changed underneath you.

## Output

A `Makefile` where `make` rebuilds only what's stale, `make -j` parallelizes it,
and a fresh clone plus `make` reproduces every number — plus the one-line command
a reader needs to reproduce the analysis themselves.
