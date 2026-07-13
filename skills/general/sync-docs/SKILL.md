---
name: sync-docs
description: >
  Audit and refresh all project documentation in throwaway/docs/ so it matches the
  current code and recent conversations. Use after a meaningful chunk of work, before
  ending a work session, or when docs feel stale.
---

# Sync docs

Bring every doc in `throwaway/docs/` back in line with reality. This project's
methodology (throwaway prototype → real build) only works if the docs are the durable
artifact — the code is disposable, the docs are not.

## Procedure

1. **Inventory.** List `throwaway/docs/` and skim each doc. Read the current code in
   `throwaway/` (structure, entry points, module responsibilities).
2. **Diff docs against reality.** For each doc, note what is stale, missing, or wrong:
   - `architecture.md` — does it describe the code as it exists now? Are components,
     data flow, and boundaries accurate? Are "planned vs. built" sections labeled
     correctly?
   - `decision-log.md` — are there decisions made in recent work/conversation that
     were never logged? Log them via the `log-decision` skill (append-only — never
     edit past entries here).
   - Any other docs — same treatment.
3. **Fix.** Update the docs. Prefer correcting and pruning over appending; stale text
   is worse than no text. The decision log is the one exception (append-only).
4. **Report.** Tell the user what changed in each doc and anything you found that
   needs their input (e.g., an undocumented decision you couldn't reconstruct).

## Rules

- No filler. If a section would just restate the code without adding understanding,
  cut it.
- Docs describe intent and rationale, not just structure — "what and why", the code
  already shows "how".
- If code and docs conflict and you can't tell which is right, flag it to the user
  instead of guessing.

## Output

A per-doc summary of what changed (or "no change needed"), plus any conflicts or
undocumented decisions flagged for the user.
