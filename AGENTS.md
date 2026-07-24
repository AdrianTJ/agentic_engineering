# AI toolkit — agent & skill workspace

This repository is the single, harness-agnostic source of truth for a collection of
AI agents and the skills they share. Nothing here is specific to any one harness
(Claude Code, Codex, Cursor, Gemini CLI, …). A generator projects this canonical
layout into per-harness layouts on demand.

## How it's organized

- `skills/<category>/<name>/SKILL.md` — the shared skill library. Each skill is written
  **once** and may be composed by any number of agents. Skills are atomic and reusable:
  one skill does one well-defined thing (e.g. `write-sql`), with optional `scripts/`,
  `references/`, and `assets/` subfolders. Category dirs (`general/`, `data-science/`)
  are purely organizational: agents reference skills by bare name, which must therefore
  be unique across categories.
- `tools/<name>/TOOL.md` — executable capabilities: a manifest (frontmatter `name`,
  `description`, `entrypoint`, `runtime`) beside the script it describes. Tools differ
  from a skill's private `scripts/`: a skill script is a helper only that skill uses,
  while a tool is a first-class capability an agent invokes directly and any agent can
  compose. Promote a skill script to `tools/` when a second consumer appears.
- `agents/<name>/AGENT.md` — a thin agent manifest. It declares the agent's identity
  and scope and lists which shared skills, tools, and connections it composes (in YAML
  frontmatter). It does **not** contain copies of skills.
- `connections/<name>.md` — a declarative pointer to an MCP server or API: its `url`,
  `kind`, and the **env var** that holds its credential (never the credential itself).
  Agents reference connections by name in their `connections:` list.
- `agents/<name>/eval/*.eval.yaml` — declarative behavior checks for that agent. See
  `shared/eval-spec.md` for the format. Specs are portable; running them is a runtime
  concern delegated to a per-harness runner.
- `harnesses/<name>.conf` — data describing where a given harness expects skills,
  agents, connections, and instructions to live.
- `bin/generate.sh` — reads the above and materializes `dist/<harness>/`.
- `vendor/anthropic-skills/skills/<name>/` — Anthropic's actively-maintained public
  skill library, vendored as a git submodule (see `vendor/README.md`). A skill name
  resolves here as a third fallback after `skills/<name>` and `skills/*/<name>`. Kept
  current by a weekly scheduled workflow that opens a PR when upstream moves.

## Conventions

- Default every skill to the shared library. Only localize a skill (under an agent
  folder) when it is both single-use and would be confusing to offer to other agents.
- Keep this file short — it is loaded on every turn. Agent-specific or directory-
  specific rules belong in a nested `AGENTS.md` next to the code they govern.
- Skills are pulled on demand; their `description` field is the entire basis on which
  an agent decides to use them, so write descriptions that say what AND when.
- `dist/` is generated output. Never edit it by hand; edit the sources and re-run
  `bin/generate.sh`.
- Never commit or push directly to `main`/`master` — branch first. Branch names
  describe the actual change (`add-eval-runner`, `fix-generate-symlinks`); no generic
  names, no tool prefixes.
- Commit at each logical checkpoint (don't batch a whole session into one commit).
  Commits are authored as Adrian TJ <adrian.tame.jacobo@gmail.com> with Claude credited
  as a trailer: `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Pull requests: describe the change, nothing more — no attribution or "Generated
  with …" block in the body.

## Build

```sh
bin/generate.sh --list            # show available harnesses
bin/generate.sh claude-code       # build one, into dist/claude-code/ (symlinks)
bin/generate.sh --all             # build all harnesses
bin/generate.sh --copy --all      # build all as real files (no symlinks)
```

## Extending this repo (for coding agents)

If you are a coding agent working in this repo, follow these conventions. Each kind of
thing is a file (or a directory) whose name and location ARE its definition; the
generator discovers it, no registration needed.

- **Add a skill:** first check whether `vendor/anthropic-skills/skills/` already has
  one that does the job (Anthropic actively maintains that library — prefer it over a
  new internal skill when the job is genuinely the same; see `vendor/README.md`). If
  not, consult the `write-skill` skill, then create
  `skills/<category>/<name>/SKILL.md` (`general/` for all-purpose, `data-science/` for
  the OSEMN pipeline) with YAML frontmatter (`name`, `description`) then a markdown body
  of instructions. The `description` must say what the skill does AND when to use it —
  it is the only thing an agent sees when deciding to load it. Bundle `scripts/`,
  `references/`, `assets/` beside it as needed. Make it atomic and reusable so more
  than one agent can compose it. Skill names must be unique across categories and
  vendored skill names; agents reference the bare name either way.
- **Add a tool:** create `tools/<name>/TOOL.md` (frontmatter: `name`, `description`
  saying what AND when, `entrypoint`, `runtime`) with the executable script beside it.
  Keep tools read-only on their inputs unless mutation is the tool's whole point.
  Reference the tool from an agent's `tools:` list.
- **Add an agent:** create `agents/<name>/AGENT.md`. Frontmatter declares `name`,
  `role`, a `skills:` list, optional `tools:` and `connections:` lists, and optional
  `delegates_to:` (names of other agents it may call as subagents). The body is the
  agent's identity, scope, and guardrails — keep it short; it becomes the system
  prompt. Reference existing shared skills by name rather than writing new ones.
- **Add a connection:** create `connections/<name>.md` with frontmatter `name`,
  `kind` (`mcp` | `openapi` | `api`), `url`, and `auth.token_env` (the env var name —
  never a secret). Reference it from an agent's `connections:` list.
- **Add an eval:** create `agents/<agent>/eval/<name>.eval.yaml` per
  `shared/eval-spec.md`.
- **After any structural change** (new/renamed skill, agent, or connection, or a
  changed `skills:`/`connections:` list), run `bin/generate.sh --all`. Pure content
  edits to an existing file need no rebuild — the generated layouts symlink back to
  the canonical sources.
- **Never** edit anything under `dist/`; it is generated. Edit the canonical sources.
