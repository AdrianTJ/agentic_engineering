# Harness engineering — a curriculum for long-horizon agents

A reading curriculum on the system around a base model: how it thinks, what it
can touch, what it remembers, when it stops, and how anyone knows whether it
worked. Twelve chapters, each a map plus a reading list, with a runnable
TypeScript reference harness that proves the claims. Start at
[`harness-engineering/README.md`](harness-engineering/README.md).

```
harness-engineering/
├── chapters/            # 01–12: problem, core reading, concepts, build exercise
├── reference-harness/   # runnable TypeScript harness, one module per chapter
├── bin/check-all.sh     # every curriculum check in dependency order
├── SOURCES.md           # where every reading comes from
├── GLOSSARY.md PROVENANCE.md ASSESSMENT.md
└── meta/research-log/   # per-pass build notes
```

## What used to be here

This repo was once a skill library (`.ruler/skills/`, Ruler distribution, eval
scoring). That half moved to
[`harness-configs`](https://github.com/AdrianTJ/harness-configs)
`shared/skills/` — `write-skill` and the `evals/evals.json` convention live
there now. What remains here is the curriculum.

## Contributing

```sh
harness-engineering/bin/check-all.sh   # the gate: measurements, harness, refs, style
```

Install it as a pre-commit hook with
`harness-engineering/bin/install-hooks.sh` — pass 09 proved discipline alone
doesn't run the checkers. See `AGENTS.md` for conventions.
