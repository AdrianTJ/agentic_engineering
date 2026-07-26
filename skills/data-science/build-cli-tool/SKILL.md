---
name: build-cli-tool
description: >
  Turn a one-off script or a long pipeline you keep retyping into a reusable
  command-line tool that reads stdin, writes stdout, and composes with other
  Unix tools. Use when the same transformation has been written more than twice,
  or when a useful snippet should become something callable by name.
---

# Build CLI tool

A tool earns its keep by composing. Anything that reads stdin and writes stdout
drops into a pipeline between two other commands; anything that hardcodes
filenames or prints decorations has to be rewritten every time it's reused.

Promote a snippet to a tool on its third use — before that it's premature, after
that you're retyping.

## Workflow

1. **Make it a file with a shebang.** `#!/usr/bin/env bash` or
   `#!/usr/bin/env python3` — `env` finds the interpreter on PATH instead of
   assuming a fixed location.
2. **Read stdin, write stdout.** Default to reading `/dev/stdin` when given no
   file argument, and accept a filename when given one. Send everything the user
   didn't ask for — progress, warnings — to stderr, so stdout stays pipeable.
3. **Exit meaningfully.** `0` on success, non-zero on failure. Pipelines and
   `make` rely on it. In bash, start with `set -euo pipefail` so a failing step
   doesn't silently continue with empty input.
4. **Handle `--help` and no arguments.** A tool that hangs on missing input
   (because it's silently waiting on stdin) is indistinguishable from a broken
   one. Print usage and exit non-zero instead.
5. **Make it executable and reachable.** `chmod +x`, then put it on PATH
   (`~/.local/bin`) or reference it by path from a Makefile.
6. **Verify it composes.** Run it in an actual pipeline —
   `cat in.csv | tool | head` — not just standalone. Check it doesn't choke on
   empty input or a closed pipe.

## Minimal shape

```bash
#!/usr/bin/env bash
# summarize — print row count and mean of a numeric column.
# Usage: summarize <column> [file.csv]     (reads stdin when file is omitted)
set -euo pipefail

col="${1:?usage: summarize <column> [file.csv]}"
src="${2:-/dev/stdin}"

csvcut -c "$col" "$src" | tail -n +2 | \
  awk -v c="$col" '{n++; s+=$1} END{ if(n) printf "%s: n=%d mean=%.4f\n", c, n, s/n;
                                     else { print "no rows" > "/dev/stderr"; exit 1 } }'
```

The `${1:?...}` form prints the usage message and exits non-zero when the
argument is missing — one line, no `if` block, and it never hangs.

## For Python tools

```python
#!/usr/bin/env python3
"""summarize — print row count and mean of a numeric column."""
import argparse, csv, statistics, sys

p = argparse.ArgumentParser(description=__doc__)
p.add_argument("column")
p.add_argument("file", nargs="?", type=argparse.FileType(), default=sys.stdin)
a = p.parse_args()

reader = csv.DictReader(a.file)
if a.column not in (reader.fieldnames or []):
    sys.exit(f"no column {a.column!r}; found: {', '.join(reader.fieldnames or [])}")

vals = [float(r[a.column]) for r in reader if r[a.column]]
if not vals:
    sys.exit(f"no numeric values in column {a.column!r}")
print(f"{a.column}: n={len(vals)} mean={statistics.mean(vals):.4f}")
```

`argparse` gives `--help` for free, and `nargs="?"` with a `sys.stdin` default is
the whole stdin-or-file behavior in one line.

The explicit `fieldnames` check is the difference between a usable error and a
raw `KeyError` traceback. Listing the columns that *do* exist turns "it broke"
into "you meant this one" — solve the failure, don't defer it to the caller.

## Guardrails

- Never print progress or banners to stdout — it corrupts the data the next
  command in the pipe is trying to parse.
- Don't buffer the entire input when a line-at-a-time pass would do; a tool that
  can't handle a file bigger than memory isn't a Unix tool.
- Exit non-zero on empty or malformed input rather than emitting an empty result
  that looks like a legitimate answer.

## Output

An executable file with a shebang, `--help`, stdin/stdout behavior, and honest
exit codes — verified inside a real pipeline. Once a second consumer appears,
promote it to `tools/<name>/` with a TOOL.md manifest per this repo's conventions.
