---
name: explore-data
description: >
  Explore a dataset before modeling or reporting on it — shape, types, distributions,
  anomalies — using fast command-line summaries. Use for the "E" (explore) step of the
  OSEMN workflow, whenever a dataset is new to the conversation, or whenever a question
  like "what does this data look like?" precedes any analysis or query.
---

# Explore data

Get to know a dataset with cheap, composable commands before committing to any model,
query, or chart. Exploration is a conversation with the data; every finding here either
kills a bad assumption or becomes a hypothesis for `model-data`.

## Workflow

1. **Shape first.** Run the `profile-csv` tool for the one-shot orientation
   (shape, columns, empty counts, sample); fall back to `csvlook data.csv | head`,
   `xsv headers`, and `wc -l` when it isn't available. Know the size before
   running anything heavier.
2. **Column summaries.** `csvstat data.csv` for types, nulls, min/max/mean/stddev,
   unique counts. Note every column whose type or null count surprises you.
3. **Sample, don't full-scan.** Eyeball random rows (`shuf -n 20`, `xsv sample 20`),
   not just the head — files are often sorted, and the head lies about the middle.
4. **Distributions and frequencies.** Frequency tables for categoricals
   (`csvcut -c col data.csv | sort | uniq -c | sort -rn`, `xsv frequency`); group
   summaries for numerics. `datamash groupby` requires input **pre-sorted by the
   group column** — it silently fragments unsorted groups into wrong sub-groups
   instead of erroring, so sort first:
   `csvsort -c col data.csv | datamash -t, --headers groupby 2 mean 5 count 5`.
5. **Quick throwaway plots.** Reach for `chart-viz` in exploratory mode for anything a
   number can't show: trends, outliers, bimodality. Speed over polish here.
6. **Write the data brief.** Close with a short note: rows × columns, key column types,
   anomalies found (nulls, duplicates, suspect values, sorted-ness), and the hypotheses
   worth modeling. This brief is what `model-data` consumes.

## Guardrails

- Exploration is read-only: never modify the file being explored (that's `scrub-data`).
- Show the commands with the findings, so any surprise can be re-checked verbatim.
- On large data, summarize with streaming tools or a sample; never load the whole file
  to answer a question `csvstat` or `datamash` can answer.

## Reference

`references/recipes.md` — exact invocations, loaded on demand: tool-selection
table · shape and orientation · column summaries · frequency and cardinality ·
group summaries · distributions and percentiles · duplicates and keys · date gaps
· sampling.

## Output

The data brief (shape, types, anomalies, hypotheses) plus the commands that produced
each finding.
