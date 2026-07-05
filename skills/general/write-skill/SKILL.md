---
name: write-skill
description: >
  Write or revise a skill, agent, connection, or eval in this repo so it follows the
  house conventions. Use whenever adding anything under skills/, agents/, or
  connections/, or when reviewing an existing skill for quality.
---

# Write skill

A skill exists to wrangle determinism out of a stochastic system: its virtue is
**predictability** — the agent taking the same *process* every run, not producing the
same output. Everything below serves that.

## Workflow

1. **Confirm it doesn't already exist.** Search `skills/*/` for an existing skill that
   covers the job; extend or compose it rather than duplicating. Names must be unique
   across category directories.
2. **Place it.** `skills/<category>/<name>/SKILL.md` — `general/` for all-purpose
   skills, `data-science/` for the OSEMN pipeline; add a category dir only when several
   skills clearly share a new domain. Agents reference the bare `<name>`.
3. **Write the description as the trigger.** It is the *only* thing an agent sees when
   deciding to load the skill, so it must say what the skill does AND when to use it.
   Front-load the leading verb ("Explore a dataset…"), cover the phrasings a user would
   actually say, one trigger per situation — no synonym padding.
4. **Write the body as checkable steps.** Numbered workflow where each step has a
   completion state a reader can verify; guardrails only for real failure modes;
   an Output section stating what the skill hands to whatever runs next. Name sibling
   skills it feeds or consumes (`explore-data` → `model-data`).
5. **Disclose progressively.** Body holds the steps; anything consulted on demand goes
   to `scripts/`, `references/`, or `assets/` beside the SKILL.md; link out for the
   rest. Keep the body short enough to scan.
6. **Prune.** Delete any sentence that doesn't change what the agent would do — don't
   reword it. One source of truth per fact; repo-wide rules live in AGENTS.md, not
   copied into skills.
7. **Wire and rebuild.** Add the skill to each composing agent's `skills:` list, add an
   eval under `agents/<agent>/eval/` per `shared/eval-spec.md`, check it with the
   `validate-evals` tool, then run `bin/generate.sh --all` and confirm zero warnings.
   Never edit `dist/`.

## Output

A placed SKILL.md (plus any `scripts/`/`references/`), updated agent manifest(s), an
eval spec, and a clean `bin/generate.sh --all` run.
