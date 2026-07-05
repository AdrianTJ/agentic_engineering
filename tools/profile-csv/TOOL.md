---
name: profile-csv
description: >
  Print a fast profile of a CSV file — shape, columns, empty-field counts, and a
  row sample — in one command. Use at the start of the explore-data workflow, or
  whenever a quick look at an unfamiliar CSV is needed before deeper analysis.
entrypoint: profile.sh
runtime: bash
---

# profile-csv

One command to get oriented in a CSV before any real work starts.

## Usage

```sh
tools/profile-csv/profile.sh <file.csv> [sample_rows]
```

- `file.csv` — the file to profile (required).
- `sample_rows` — how many random data rows to show (default 5).

## Behavior

Prints: file name, row and column counts, the numbered column list, per-column
empty-field counts, and a random sample of rows (random via `shuf` when
available, else the head). If `csvstat` (csvkit) is installed it is used for the
column statistics, which handles quoted commas correctly; otherwise a naive
`awk` fallback runs — fine for well-behaved CSVs, unreliable on quoted embedded
commas (the same caveat `scrub-data` gives about `cut -d,`).

## Output

A plain-text profile on stdout, suitable for pasting into the data brief that
the `explore-data` skill produces. Read-only: the input file is never modified.
