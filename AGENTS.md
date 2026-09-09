# Harness engineering curriculum

This repository is one thing: the long-horizon-agent curriculum under
`harness-engineering/` (chapters, reference harness, checkers). The skill
library that used to live here moved to `harness-configs/shared/skills/`.

## How it's organized

- `harness-engineering/chapters/*.md` — the twelve chapters. Fixed shape:
  problem, core reading, key concepts, build exercise, self-check.
- `harness-engineering/reference-harness/` — runnable TypeScript harness proving
  the chapters' claims; `verify.sh` compares against committed `baseline.json`.
- `harness-engineering/bin/check-all.sh` — every check in dependency order.
  Run it before committing; install it as a hook via `bin/install-hooks.sh`.
- `harness-engineering/SOURCES.md`, `sources.tsv` — reading provenance.

## Conventions

- Keep this file short — it is loaded on every turn.
- Never commit or push directly to `main` — branch first. Branch names
  describe the actual change; no generic names, no tool prefixes.
- Commit at each logical checkpoint (don't batch a whole session into one commit).
  Commits are authored as Adrian TJ <adrian.tame.jacobo@gmail.com> with Claude credited
  as a trailer: `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Pull requests: describe the change, nothing more — no attribution or "Generated
  with …" block in the body.

## Check

```sh
harness-engineering/bin/check-all.sh   # gate: measurements, harness, refs, style
```
