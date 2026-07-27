# AI toolkit

A library of [Agent Skills](https://agentskills.io/specification) — reusable,
harness-agnostic instructions an AI coding agent loads on demand. Sixteen skills,
mostly a CLI-first data-science pipeline, each written once and distributed to any
agent that supports the standard.

This repo deliberately owns **no tooling**. Distribution is
[Ruler](https://github.com/intellectronica/ruler); eval scoring is
[agent-skills-eval](https://github.com/darkrishabh/agent-skills-eval); the skill format
is the published spec. What's here is the content.

```
.ruler/skills/
├── data-science/          # a CLI-first pipeline: obtain → scrub → explore → model
│   ├── obtain-data/       #   fetch, paginate, record provenance
│   ├── scrub-data/        #   encoding, structure, values — in that order
│   ├── explore-data/
│   │   ├── SKILL.md       #     scannable: workflow + index
│   │   ├── references/    #     dense recipes, loaded only when needed
│   │   ├── scripts/       #     helpers the skill calls
│   │   └── evals/         #     evals.json + fixtures
│   ├── model-data/        #   baseline first, hold out, report uncertainty
│   ├── write-sql/  introspect-schema/  chart-viz/
│   ├── make-pipeline/     #   reproducible multi-step pipelines (Make)
│   └── build-cli-tool/    #   turn a script into a composable tool
└── general/
    ├── write-skill/  validate-results/  parallelize-pipeline/
    ├── stakeholder-narrative/  build-deck/
    └── sync-docs/  log-decision/
```

## Using it

Install Ruler, then project the skills into whichever agents you use:

```sh
npm i -g @intellectronica/ruler
ruler apply --agents claude,codex,opencode,pi,antigravity,agentsmd
```

That writes `.claude/skills/`, `.agents/skills/`, `.opencode/skills/` and so on, each
in that tool's native location, with `references/` and `scripts/` intact. Ruler
supports 30+ targets — `ruler apply --help` lists them.

Two ways to consume this repo:

- **Use it directly** — clone it and run `ruler apply` inside; `.ruler/` is already
  laid out the way Ruler expects.
- **Copy what you want** — drop individual skill directories into your own project's
  `.ruler/skills/`. Each skill is self-contained.

Scope targets with the `--agents` flag rather than `ruler.toml`; in Ruler 0.3.x the
config keys don't limit the run.

## What's actually in here

The data-science skills are the substance: not summaries of a methodology, but
recipes that were **executed and corrected**. Several shipped bugs that only appeared
when run — a `datamash` invocation that silently mis-grouped unsorted input, a `sed`
that ate CSV field separators and merged columns without erroring, a documented
rationale that was simply wrong about which tool a BOM breaks. Each is now a guardrail
in the skill that hit it.

Skills that overlap something Anthropic maintains (`pptx`, `xlsx`, `skill-creator`)
defer to theirs rather than reimplementing it — install those from
[anthropics/skills](https://github.com/anthropics/skills), or get them natively on
Claude.

## Contributing

```sh
bin/test.sh    # spec conformance, eval structure, ruler projection, script syntax
```

See `AGENTS.md` for conventions and the `write-skill` skill for how to author one.
Evals live with their skill; `docs/eval-spec.md` covers the format and how to score
them against a real model.
