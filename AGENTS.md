# AI toolkit — a skill library

This repository is a library of [Agent Skills](https://agentskills.io/specification):
reusable, harness-agnostic instructions an AI agent loads on demand. It defines no
tooling of its own — [Ruler](https://github.com/intellectronica/ruler) distributes the
skills to 30+ coding agents, and
[agent-skills-eval](https://github.com/darkrishabh/agent-skills-eval) scores them.

## How it's organized

- `.ruler/skills/<category>/<name>/SKILL.md` — the library. Each skill is written
  **once**. Spec rules: frontmatter `name` must match the directory name exactly
  (lowercase alphanumerics and single hyphens); `description` says what the skill does
  AND when to use it, in ≤1024 characters. Category dirs (`general/`,
  `data-science/`) are organizational only — agents load skills by description, not
  by category.
- `.ruler/skills/<...>/references/*.md` — dense material loaded on demand. Keep
  SKILL.md scannable and push detail here (progressive disclosure).
- `.ruler/skills/<...>/scripts/*` — helpers a skill invokes by relative path.
- `.ruler/skills/<...>/evals/evals.json` — that skill's evals. See `docs/eval-spec.md`.
- `bin/test.sh` — the whole check suite; `bin/validate.py` does the heavy lifting.
- `ruler.toml` — Ruler config. Scope targets with `ruler apply --agents …`, not this
  file (see the comment in it).

External services (warehouses, APIs) are configured in the *harness's* own MCP config,
never here — no credential or endpoint belongs in this repo.

## Conventions

- Keep this file short — it is loaded on every turn.
- A skill's `description` is the entire basis on which an agent decides to use it, so
  write descriptions that say what AND when.
- **Verify anything you document.** Run the commands before shipping them. Recipes here
  have shipped bugs that only surfaced on execution.
- Prefer a skill Anthropic already maintains
  ([anthropics/skills](https://github.com/anthropics/skills)) over writing an
  equivalent one here.
- Never commit or push directly to `main`/`master` — branch first. Branch names
  describe the actual change (`add-duckdb-recipes`, `fix-scrub-regex`); no generic
  names, no tool prefixes.
- Commit at each logical checkpoint (don't batch a whole session into one commit).
  Commits are authored as Adrian TJ <adrian.tame.jacobo@gmail.com> with Claude credited
  as a trailer: `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Pull requests: describe the change, nothing more — no attribution or "Generated
  with …" block in the body.

## Check

```sh
bin/test.sh          # spec conformance + eval structure + ruler projection + scripts
```

## Extending this repo (for coding agents)

- **Add or revise a skill:** consult the `write-skill` skill and follow it. It covers
  the craft; this repo adds only: place it under `.ruler/skills/general/` (all-purpose)
  or `.ruler/skills/data-science/` (the CLI data pipeline), write its evals to
  `evals/evals.json` per `docs/eval-spec.md`, and run `bin/test.sh` before pushing.
- **Distribute:** `ruler apply --agents claude,codex,opencode,pi,antigravity,agentsmd`.
  Consumers usually run this from their own project with their own `ruler.toml`.
