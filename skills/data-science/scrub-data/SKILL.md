---
name: scrub-data
description: >
  Clean and normalize messy tabular or semi-structured data into a tidy form at the
  command line. Use whenever data needs trimming, deduping, reshaping, type-fixing,
  encoding repair, or conversion between CSV/TSV/JSON/HTML — the "S" (scrub) step of
  the OSEMN data-science workflow.
---

# Scrub data

Turn raw, messy input into tidy data using small, composable Unix tools.

## Tool palette

- `sed`, `awk`, `cut`, `tr` — line/field-level surgery on plain text.
- `csvkit` (`csvclean`, `csvcut`, `csvstat`, `csvformat`) — robust CSV handling that
  respects quoting and embedded delimiters. Prefer this over naive `cut -d,` on real
  CSVs, which breaks on quoted commas.
- `jq` — slice, filter, and reshape JSON; flatten nested API responses to rows.
- `iconv` — repair character encodings before anything else touches the bytes.

This palette targets CSV/TSV/JSON/HTML. When the messy data is specifically a
spreadsheet file (`.xlsx`/`.xlsm`), use the `xlsx` skill instead — it understands the
file's internal structure (formulas, sheets, formatting) in a way CLI text tools don't.

## Workflow

1. **Inspect first.** Look at the raw head/tail and run `csvstat` to learn column
   types, null counts, and obvious anomalies before changing anything.
2. **Fix encoding, then structure, then values** — in that order. Re-encoding after
   you've parsed fields corrupts work.
3. **One transformation per stage** in the pipeline, so each step is inspectable.
4. **Keep the raw input immutable.** Write cleaned output to a new file; never edit
   the source in place.

## Reference

`references/recipes.md` — exact invocations, loaded on demand: tool-selection
table · encoding and line endings · delimiters, quoting, headers · column and row
surgery · value and type normalization · missing data · deduplication ·
reshaping · format conversion.

## Output

A tidy dataset (one variable per column, one observation per row) plus a one-line
note of what was changed and why.
