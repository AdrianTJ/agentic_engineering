---
name: write-skill
description: >
  Write or revise an Agent Skill so it conforms to the agentskills.io spec and is
  actually reliable — description that triggers correctly, checkable steps,
  progressive disclosure. Use when adding a skill, or when reviewing an existing
  one for quality.
---

# Write skill

A skill exists to wrangle determinism out of a stochastic system: its virtue is
**predictability** — the agent taking the same *process* every run, not producing
the same output. Everything below serves that.

## Workflow

1. **Confirm it doesn't already exist.** Search the skills already available for
   something covering the job, and check whether Anthropic maintains one
   ([anthropics/skills](https://github.com/anthropics/skills) — `docx`, `pdf`,
   `pptx`, `xlsx`, `skill-creator` and more). Prefer referencing theirs over
   writing your own when the job is genuinely the same; compose, don't duplicate.
2. **Draft the content.** On Claude, use the `skill-creator` skill's
   interview → draft → benchmark process — it is better at this than improvising,
   and it measures whether the skill actually changed behavior. Elsewhere, follow
   the rest of this workflow directly.
3. **Place it and name it.** One directory per skill, containing `SKILL.md`. The
   spec requires the frontmatter **`name` to match the directory name exactly**:
   1–64 characters, lowercase alphanumerics separated by single hyphens. Group
   related skills into category directories once you have enough to warrant it.
4. **Write the description as the trigger.** It is the *only* thing an agent sees
   when deciding to load the skill, so it must say what the skill does AND when
   to use it. Front-load the leading verb ("Explore a dataset…"), cover the
   phrasings a user would actually say, one trigger per situation — no synonym
   padding. Cap 1024 characters.
5. **Write the body as checkable steps.** Numbered workflow where each step has a
   completion state a reader can verify; guardrails only for real failure modes;
   an Output section stating what the skill hands to whatever runs next. Name
   sibling skills it feeds or consumes (`explore-data` → `model-data`).
6. **Disclose progressively.** The body holds the steps; anything consulted on
   demand goes to `references/` or `scripts/` beside the SKILL.md. Keep the body
   short enough to scan — under ~150 lines — with a short index pointing at the
   references.
7. **Verify anything you claim.** Run every command you document before shipping
   it. This is the step people skip and the one that catches real bugs: a
   `datamash` invocation that silently mis-grouped unsorted input, a `sed` that
   ate CSV field separators and merged columns without erroring, a stated
   rationale that was simply wrong about which tool a byte-order mark breaks.
   Every one of those looked correct on the page. Writing a recipe and believing
   it is not the same as running it.
8. **Add evals.** At least one per skill, describing a realistic request and what
   a good response does — see the
   [Agent Skills eval format](https://github.com/darkrishabh/agent-skills-eval).
   Write the prompt as a user would say it, without naming the skill, or the eval
   only proves the model can follow an instruction you already gave it.

## Prune

Delete any sentence that doesn't change what the agent would do — don't reword
it. One source of truth per fact: project-wide rules belong in the project's own
`AGENTS.md`, not copied into every skill.

## Output

A spec-conforming `SKILL.md` (plus any `references/`/`scripts/`) and at least one
eval, validated by whatever check the project runs.
