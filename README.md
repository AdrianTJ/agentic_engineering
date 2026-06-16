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
│   ├── data-science/AGENT.md
│   ├── sql/AGENT.md
│   └── presentation/AGENT.md
├── skills/                   # the shared library — each skill written ONCE
│   ├── write-sql/            #   (with scripts/, references/, assets/ as needed)
│   ├── scrub-data/
│   ├── chart-viz/
│   └── …
└── shared/datasets/          # fixtures for evals
```

## The core idea

- **Skills are shared.** `write-sql` is composed by both the SQL agent and the data
  science agent. You write it once; both pull it.
- **Agents are thin.** An `AGENT.md` declares identity, scope, and a list of skill
  names — never copies of skills.
- **Harness layout is data, not code.** Each `harnesses/*.conf` says where that harness
  wants skills, agents, and the instructions file. Adding a harness is one new file;
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
`INSTRUCTIONS_FILE`, `ALSO_AGENTS_MD`, `AGENT_FILE_EXT`. Anything you omit takes a
sensible default (top-level `skills/`, `agents/`, `AGENTS.md`).

## Adding an agent or skill

- New skill: `mkdir skills/<name> && $EDITOR skills/<name>/SKILL.md` (name + description
  frontmatter, then instructions). Reference it from any agent's `skills:` list.
- New agent: `mkdir agents/<name> && $EDITOR agents/<name>/AGENT.md` with a `skills:`
  list in the frontmatter. Re-run the generator.
