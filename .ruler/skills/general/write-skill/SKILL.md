---
name: write-skill
description: >
  Write or revise a skill in this library so it conforms to the Agent Skills
  spec and this repo's conventions. Use whenever adding anything under
  .ruler/skills/, or when reviewing an existing skill for quality.
---

# Write skill

A skill exists to wrangle determinism out of a stochastic system: its virtue is
**predictability** — the agent taking the same *process* every run, not producing
the same output. Everything below serves that.

## Workflow

1. **Confirm it doesn't already exist.** Search `.ruler/skills/*/` for something
   that covers the job, and check whether Anthropic already maintains one
   ([anthropics/skills](https://github.com/anthropics/skills) — `docx`, `pdf`,
   `pptx`, `xlsx`, `skill-creator` and more). Prefer referencing theirs over
   writing your own when the job is genuinely the same; compose, don't duplicate.
2. **Draft the content.** On Claude, use the `skill-creator` skill's
   interview → draft → benchmark process — it is better at this than improvising,
   and it measures whether the skill actually changed behavior. Elsewhere, follow
   the conventions in the rest of this workflow directly.
3. **Place it.** `.ruler/skills/<category>/<name>/SKILL.md` — `general/` for
   all-purpose, `data-science/` for the CLI data pipeline; add a category only
   when several skills clearly share a new domain. The spec requires
   **`name` in the frontmatter to match the directory name exactly**, lowercase
   alphanumerics and single hyphens.
4. **Write the description as the trigger.** It is the *only* thing an agent sees
   when deciding to load the skill, so it must say what the skill does AND when
   to use it. Front-load the leading verb ("Explore a dataset…"), cover the
   phrasings a user would actually say, one trigger per situation — no synonym
   padding. Cap 1024 characters.
5. **Write the body as checkable steps.** Numbered workflow where each step has a
   completion state a reader can verify; guardrails only for real failure modes;
   an Output section stating what the skill hands to whatever runs next. Name
   sibling skills it feeds or consumes (`explore-data` → `model-data`).
6. **Disclose progressively.** Body holds the steps; anything consulted on demand
   goes to `references/` or `scripts/` beside the SKILL.md. Keep the body short
   enough to scan — under ~150 lines — and give it a short index pointing at the
   references.
7. **Verify anything you claim.** Run every command you document before shipping
   it. Recipes in this library have shipped bugs that only appeared on execution:
   a `datamash` invocation that silently mis-grouped unsorted input, a `sed` that
   ate CSV field separators, a rationale that was simply wrong about which tool
   breaks. Writing a recipe and believing it is not the same as running it.
8. **Add evals and validate.** Create `evals/evals.json` per `docs/eval-spec.md`,
   then run `bin/test.sh` — it checks spec conformance, eval structure, and that
   Ruler can still project the library.

## Prune

Delete any sentence that doesn't change what the agent would do — don't reword
it. One source of truth per fact; repo-wide rules live in `AGENTS.md`, not copied
into skills.

## Output

A spec-conforming `SKILL.md` (plus any `references/`/`scripts/`), an
`evals/evals.json`, and a clean `bin/test.sh` run.
