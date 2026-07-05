---
name: validate-evals
description: >
  Validate every eval spec in the repo against shared/eval-spec.md — required
  keys, assertion vocabulary, and fixture paths. Use after adding or editing any
  agents/<agent>/eval/*.eval.yaml, and in CI as a merge gate.
entrypoint: validate_evals.py
runtime: python3
---

# validate-evals

Static checker for the declarative eval specs. Catches malformed specs before a
runner (or CI) trips over them.

## Usage

```sh
python3 tools/validate-evals/validate_evals.py
```

No arguments: it locates the repo root relative to itself and discovers
`agents/*/eval/*.eval.yaml`.

## Checks

- Required keys present: `name`, `description`, `prompt`, `expect`.
- Every assertion key is in the vocabulary defined by `shared/eval-spec.md`
  (`skill_loaded`, `connection_used`, `tool_called`, `reply_contains`,
  `reply_not_contains`, `reply_matches`).
- `reply_matches` values compile as regular expressions.
- Every `fixtures` path exists in the repo.
- `name` matches the spec's filename stem and is unique within its agent.

## Output

One `OK`/`FAIL` line per spec on stdout; exit code 0 only if every spec passes.
Requires `pyyaml`.
