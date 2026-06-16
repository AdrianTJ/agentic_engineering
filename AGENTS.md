# AI toolkit — agent & skill workspace

This repository is the single, harness-agnostic source of truth for a collection of
AI agents and the skills they share. Nothing here is specific to any one harness
(Claude Code, Codex, Cursor, Gemini CLI, …). A generator projects this canonical
layout into per-harness layouts on demand.

## How it's organized

- `skills/<name>/SKILL.md` — the shared skill library. Each skill is written **once**
  and may be composed by any number of agents. Skills are atomic and reusable: one
  skill does one well-defined thing (e.g. `write-sql`), with optional `scripts/`,
  `references/`, and `assets/` subfolders.
- `agents/<name>/AGENT.md` — a thin agent manifest. It declares the agent's identity
  and scope and lists which shared skills it composes (in YAML frontmatter). It does
  **not** contain copies of skills.
- `harnesses/<name>.conf` — data describing where a given harness expects skills,
  agents, and instructions to live.
- `bin/generate.sh` — reads the above and materializes `dist/<harness>/`.

## Conventions

- Default every skill to the shared library. Only localize a skill (under an agent
  folder) when it is both single-use and would be confusing to offer to other agents.
- Keep this file short — it is loaded on every turn. Agent-specific or directory-
  specific rules belong in a nested `AGENTS.md` next to the code they govern.
- Skills are pulled on demand; their `description` field is the entire basis on which
  an agent decides to use them, so write descriptions that say what AND when.
- `dist/` is generated output. Never edit it by hand; edit the sources and re-run
  `bin/generate.sh`.

## Build

```sh
bin/generate.sh --list            # show available harnesses
bin/generate.sh claude-code       # build one, into dist/claude-code/ (symlinks)
bin/generate.sh --all             # build all harnesses
bin/generate.sh --copy --all      # build all as real files (no symlinks)
```
