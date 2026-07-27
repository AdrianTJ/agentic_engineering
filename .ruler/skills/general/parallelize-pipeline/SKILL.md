---
name: parallelize-pipeline
description: >
  Parallelize a verified command or pipeline across many inputs — files, dates,
  parameters, hosts — with GNU parallel or xargs. Use whenever the same operation must
  run over a batch of inputs ("for each file/month/ticker…"), or when a working
  single-input pipeline needs to scale out.
---

# Parallelize pipeline

Scale out only what already works. Parallelism multiplies whatever it is given —
including mistakes — so the unit of work is proven correct first, then fanned out.

## Workflow

1. **Verify on one input.** Run the pipeline end-to-end on a single representative
   input and check the output by hand. A pipeline that hasn't run correctly once does
   not get parallelized.
2. **Make it idempotent and self-contained.** One input → one output file whose name is
   derived from the input (`out/{/.}.csv`). Re-running must be safe; no step may append
   to or mutate shared state.
3. **Dry-run the fan-out.** `parallel --dry-run` (or echo via `xargs`) and read the
   generated commands before executing any of them.
4. **Execute with a job log.** `parallel --joblog jobs.log -j <n>`, or `xargs -P` when
   GNU parallel is unavailable. Bound `-j` by the bottleneck (CPU, disk, or a remote
   API's rate limit — stay a good citizen).
5. **Verify counts and failures.** Outputs == inputs; scan the job log for nonzero exit
   codes; re-run only the failures (`parallel --retry-failed --joblog jobs.log`).
   Spot-check one output beyond the one verified in step 1.

## Guardrails

- Keep raw inputs immutable; parallel jobs write only their own derived outputs.
- Report partial failure explicitly — "118/120 succeeded, 2 failed (listed)" — never
  silently deliver an incomplete batch as complete.

## Output

The batch of per-input outputs, the job log, and a one-line reconciliation
(inputs vs. outputs vs. failures), plus the exact fan-out command for reruns.

## Related

This skill fans *one* verified command across *many* inputs. When the work is
instead a *sequence* of dependent steps that should re-run incrementally, use
`make-pipeline` — and note `make -j` parallelizes that graph for free, so the two
compose rather than compete.
