# Evals

Each skill carries its own evals in `evals/evals.json`, in the format
[agent-skills-eval](https://github.com/darkrishabh/agent-skills-eval) reads. We
don't define a format of our own — the runner exists, so we use its.

## Layout

```
.ruler/skills/<category>/<name>/
├── SKILL.md
└── evals/
    ├── evals.json
    └── files/            # fixtures referenced by `files:`, paths relative to the skill dir
```

## Format

```json
{
  "skill_name": "explore-data",
  "evals": [
    {
      "id": "scales-to-duckdb",
      "name": "reaches for DuckDB on large files",
      "prompt": "I've got a 4 GB CSV and I need mean order value by region.",
      "files": ["evals/files/orders_sample.csv"],
      "expected_output": "Recommends DuckDB rather than row-wise CLI tools.",
      "assertions": [
        "The response recommends DuckDB or Parquet for a file of this size.",
        "The response does not recommend grinding through the file with csvkit or awk alone."
      ]
    }
  ]
}
```

`skill_name` must match the skill's directory. `id` must be unique within the
file. `assertions` are plain English, graded by a model; omit them and
`expected_output` is promoted into a judge assertion automatically.

## Writing assertions

Assert **behavior a reader could check**, not phrasing. "The response dry-runs
the fan-out before executing it" survives a rewording of the skill; "the reply
contains `--dry-run`" does not.

Prefer stating the failure you're guarding against. Several assertions here came
from bugs found by actually running the skills, which is why they read as
"does not …".

## Running them

Scoring calls a real model, so it costs money and needs an API key — that's why
it isn't in CI:

```sh
npx agent-skills-eval --skill .ruler/skills/data-science/explore-data
```

The runner executes each eval twice, **with and without** the skill loaded, so
the result is "did this skill change the outcome" rather than "did the model
happen to answer well." That baseline comparison is the same discipline
`model-data` insists on.

## What CI does instead

`bin/validate-evals.py` checks every eval is structurally sound — valid JSON,
`skill_name` matches its directory, unique ids, non-empty assertions, fixture
paths resolve — plus that every SKILL.md conforms to the
[Agent Skills spec](https://agentskills.io/specification). Free, fast, and it
catches a malformed spec before you spend a billed run discovering it.
