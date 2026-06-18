# Eval spec format

Evals are **declarative** and harness-agnostic, like everything else in this repo.
A spec describes one scenario: what to ask the agent and what must be true of the run.
It says nothing about *how* a particular harness executes it. A thin per-harness
runner (not included — it's the one piece that must know the runtime) drives the agent
and checks the assertions. Keeping specs declarative means the same eval grades the
same agent no matter which harness runs the loop.

Each eval lives next to the agent it tests: `agents/<agent>/eval/<name>.eval.yaml`.

## Schema

```yaml
name:        string   # unique within the agent's eval/ dir
description: string   # what behavior this checks, in one line
prompt:      string   # the user turn to send the agent
expect:               # list of assertions; ALL must hold for the eval to pass
  - <assertion>: <value>
fixtures:             # optional: data files the scenario needs, repo-relative paths
  - shared/datasets/orders_sample.csv
```

## Assertion vocabulary

- `skill_loaded:    <skill-name>`       the agent consulted this skill during the run
- `connection_used: <connection-name>`  the agent used this connection
- `tool_called:     <tool-or-op-name>`  the agent invoked this tool/operation
- `reply_contains:     <substring>`     the final reply contains this text (case-insensitive)
- `reply_not_contains: <substring>`     the final reply does NOT contain this text
- `reply_matches:      <regex>`         the final reply matches this regular expression

Assertions are intentionally about *observable* behavior (which skill/connection/tool
was used, what the reply said), not internal state, so any runner can evaluate them
from the structured event stream a harness already emits.

## Running

There is no bundled runner yet — execution is the runtime's job, and we're keeping
this repo out of the runtime business for now. When you add one, point it at the
canonical repo (not a generated `dist/`), discover `agents/*/eval/*.eval.yaml`, run
each `prompt` against the agent, and score the `expect` list. Wire it into CI as a
deploy gate once it exists.
