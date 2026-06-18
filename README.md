# AI toolkit

A single, **harness-agnostic** workspace for a collection of AI agents and the skills
they share. You author everything once, in a neutral layout, and a small generator
projects it into whatever each harness (Claude Code, Codex, …) expects.

```
ai-toolkit/
├── AGENTS.md                 # always-on project context (the entry point)
├── bin/generate.sh           # projects the repo into dist/<harness>/
├── harnesses/                # one .conf per harness — pure data, add freely
│   ├── claude-code.conf
│   ├── codex.conf
│   └── generic.conf
├── agents/                   # thin manifests: identity + which skills/connections they compose
│   ├── data-science/
│   │   ├── AGENT.md
│   │   └── eval/*.eval.yaml   #   declarative behavior checks for this agent
│   ├── sql/
│   └── presentation/
├── skills/                   # the shared library — each skill written ONCE
│   ├── write-sql/            #   (with scripts/, references/, assets/ as needed)
│   ├── scrub-data/
│   ├── chart-viz/
│   └── …
├── connections/              # declarative pointers to MCP servers / APIs (env var, never secret)
│   ├── warehouse-server.md
│   └── metrics-api.md
└── shared/
    ├── eval-spec.md          # the eval spec format
    └── datasets/             # fixtures for evals
```

## The core idea

- **Skills are shared.** `write-sql` is composed by both the SQL agent and the data
  science agent. You write it once; both pull it.
- **Agents are thin.** An `AGENT.md` declares identity, scope, and lists of skill and
  connection names — never copies of skills.
- **Connections are declarative.** A `connections/<name>.md` points at an MCP server or
  API and names the env var holding its secret; the secret never lives in the repo.
- **Evals are declarative too.** `agents/<agent>/eval/*.eval.yaml` describe behavior to
  check (see `shared/eval-spec.md`); running them is left to a per-harness runner.
- **Harness layout is data, not code.** Each `harnesses/*.conf` says where that harness
  wants skills, agents, and connections. Adding a harness is one new file;
  `bin/generate.sh` never changes.

## Usage

```sh
bin/generate.sh --list          # list harnesses
bin/generate.sh claude-code     # -> dist/claude-code/ (symlinks to canonical sources)
bin/generate.sh --all           # build every harness
bin/generate.sh --copy --all    # build all as real files (for shipping / no-symlink envs)
bin/generate.sh --clean         # remove dist/
```

`dist/` is generated and git-ignored. Edit the sources, re-run, point your harness at
`dist/<harness>/` (or symlink/copy it into place).

## Adding a harness

Drop a `harnesses/<name>.conf` setting any of: `SKILLS_DIR`, `AGENTS_DIR`,
`CONNECTIONS_DIR`, `INSTRUCTIONS_FILE`, `ALSO_AGENTS_MD`, `AGENT_FILE_EXT`. Anything you
omit takes a sensible default (top-level `skills/`, `agents/`, `AGENTS.md`, and — for
`CONNECTIONS_DIR` — empty, meaning that harness gets no projected connections).

## Adding an agent, skill, or connection

- New skill: `mkdir skills/<name> && $EDITOR skills/<name>/SKILL.md` (name + description
  frontmatter, then instructions). Reference it from any agent's `skills:` list.
- New agent: `mkdir agents/<name> && $EDITOR agents/<name>/AGENT.md` with `skills:` and
  optional `connections:` lists in the frontmatter. Re-run the generator.
- New connection: `$EDITOR connections/<name>.md` (`name`, `kind`, `url`,
  `auth.token_env`). Reference it from an agent's `connections:` list.

See the "Extending this repo (for coding agents)" section of `AGENTS.md` for the full
conventions a coding agent should follow.

## Bootstrap prompt for a coding agent

Paste this to point a coding agent at the repo and have it extend it correctly:

```text
This repo is a harness-agnostic workspace for AI agents and shared skills. Read
AGENTS.md first — especially "Extending this repo (for coding agents)" — and follow its
conventions exactly. The canonical sources are skills/<name>/SKILL.md (shared skills,
each with name+description frontmatter), agents/<name>/AGENT.md (thin manifests with
skills:/connections:/delegates_to: frontmatter and a short identity body),
connections/<name>.md (declarative MCP/API pointers naming an env var, never a secret),
and agents/<agent>/eval/*.eval.yaml (declarative checks per shared/eval-spec.md). A
file's name and location are its definition; bin/generate.sh discovers everything, so
never register anything by hand and never edit dist/. After any structural change, run
bin/generate.sh --all. Reuse existing shared skills by name instead of duplicating them.
```
