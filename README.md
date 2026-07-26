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
├── agents/                   # thin manifests: identity + which skills they compose
│   ├── data-science/
│   │   ├── AGENT.md
│   │   └── eval/*.eval.yaml   #   declarative behavior checks for this agent
│   ├── sql/
│   ├── presentation/
│   ├── toolkit/              #   meta-agent: maintains this workspace itself
│   ├── docs/                 #   keeps project docs and the decision log current
│   └── fixtures/             #   data files the evals reference
├── skills/                   # the shared library — each skill written ONCE
│   ├── general/              #   all-purpose skills
│   │   ├── write-skill/      #   (with scripts/, references/, assets/ as needed)
│   │   ├── validate-results/
│   │   ├── sync-docs/
│   │   ├── log-decision/
│   │   └── …
│   └── data-science/         #   the CLI-first OSEMN pipeline
│       ├── obtain-data/
│       ├── scrub-data/
│       ├── explore-data/
│       │   ├── SKILL.md      #     front-loaded: workflow + topic index
│       │   └── references/   #     dense recipes, loaded only when needed
│       ├── model-data/
│       ├── make-pipeline/    #     reproducible multi-step pipelines (Make)
│       ├── build-cli-tool/   #     turn a script into a composable tool
│       └── …
├── docs/                     # eval-spec.md (the spec format) + decision-log.md
└── vendor/
    └── anthropic-skills/     #   git submodule: anthropics/skills, kept in sync automatically
```

## The core idea

- **Skills are shared.** `write-sql` is composed by both the SQL agent and the data
  science agent. You write it once; both pull it.
- **Agents are thin.** An `AGENT.md` declares identity, scope, and a list of skill
  names — never copies of skills.
- **Evals are declarative too.** `agents/<agent>/eval/*.eval.yaml` describe behavior to
  check (see `docs/eval-spec.md`); running them is left to a per-harness runner.
- **Harness layout is data, not code.** Each `harnesses/*.conf` says where that harness
  wants skills and agents. Adding a harness is one new file; `bin/generate.sh` never
  changes.
- **External services stay out.** MCP servers and API credentials are configured in the
  harness's own config, never in this repo — an agent that needs one just says so in
  its body.
- **Prefer what Anthropic already maintains.** `vendor/anthropic-skills/` vendors their
  public skill library as a submodule; a skill name resolves there if it's not in our
  own `skills/`. Gives non-Claude harnesses the same `docx`/`pdf`/`pptx`/`xlsx`/
  `skill-creator` that Claude Code/claude.ai already have natively — see `vendor/README.md`.

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
`INSTRUCTIONS_FILE`, `ALSO_AGENTS_MD`, `AGENT_FILE_EXT`. Anything you omit takes a
sensible default (top-level `skills/`, `agents/`, `AGENTS.md`).

## Adding an agent or skill

- New skill: `mkdir skills/<category>/<name> && $EDITOR skills/<category>/<name>/SKILL.md`
  (name + description frontmatter, then instructions; category is `general/`,
  `data-science/`, or a new domain dir — names must be unique across categories).
  Reference it by bare name from any agent's `skills:` list. The `write-skill` skill
  documents the house style.
- New agent: `mkdir agents/<name> && $EDITOR agents/<name>/AGENT.md` with a `skills:`
  list in the frontmatter. Re-run the generator.
- A script a skill needs goes in `scripts/` beside that skill's SKILL.md; a
  repo-maintenance script goes in `bin/`.

See the "Extending this repo (for coding agents)" section of `AGENTS.md` for the full
conventions a coding agent should follow.

## Bootstrap prompt for a coding agent

Paste this to point a coding agent at the repo and have it extend it correctly:

```text
This repo is a harness-agnostic workspace for AI agents and shared skills. Read
AGENTS.md first — especially "Extending this repo (for coding agents)" — and follow its
conventions exactly. The canonical sources are skills/<category>/<name>/SKILL.md (shared
skills, each with name+description frontmatter; category dirs are organizational only —
agents reference bare skill names), agents/<name>/AGENT.md (thin manifests with
skills:/delegates_to: frontmatter and a short identity body),
and agents/<agent>/eval/*.eval.yaml (declarative checks per docs/eval-spec.md). A
file's name and location are its definition; bin/generate.sh discovers everything, so
never register anything by hand and never edit dist/. After any structural change, run
bin/generate.sh --all. Reuse existing shared skills by name instead of duplicating them.
```
