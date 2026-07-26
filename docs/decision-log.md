# Decision log

Append-only. See `log-decision` skill for the entry format and rules.

## DEC-001: Split skills/ into general/ and data-science/ category directories
- **Date:** 2026-07-05
- **Status:** decided
- **Context:** The skill library started as a flat `skills/<name>/` layout. As
  all-purpose skills (build-deck, stakeholder-narrative) and OSEMN-pipeline skills
  (obtain-data, scrub-data, chart-viz, introspect-schema, write-sql) grew alongside
  each other, a flat directory made the two families hard to tell apart at a glance —
  the same friction mattered-pocock/skills's own `engineering/`/`productivity/` split
  was chosen to avoid.
- **Options considered:**
  - Keep flat, rely on naming alone — simplest, but doesn't scale past ~10 skills.
  - Category subdirectories, agents still reference by bare name — organizational
    only, no change to how agents compose skills.
- **Decision:** Category subdirectories (`general/`, `data-science/`), skill names
  stay unique across categories, and `bin/generate.sh` resolves bare names by
  searching category dirs (falls back to flat `skills/<name>` for back-compat).
- **Consequences:** New skills must pick a category (or justify a new one). Skill
  names remain the single reference key everywhere else (agents, evals, docs).

## DEC-002: Generalize the docs agent's skills away from a one-off project layout
- **Date:** 2026-07-24
- **Status:** decided
- **Context:** `sync-docs` and `log-decision` were originally handed over verbatim
  from a different, past project that used a `throwaway/docs/` layout and a
  "throwaway prototype → real build" methodology framing specific to that project.
  Adding them as-is would have made the `docs` agent useless outside that one
  project's directory convention.
- **Options considered:**
  - Keep verbatim, since it was explicitly handed over as "the way I do docs" —
    risks the skill silently doing nothing on any repo without a `throwaway/` dir.
  - Generalize the path and drop the project-specific methodology language, keep
    the append-only decision-log discipline and DEC-NNN format unchanged.
- **Decision:** Generalized both skills: `sync-docs` now locates whatever docs
  directory a project actually uses instead of assuming one, and `log-decision`
  points at a conventional `docs/decision-log.md`, creating it if absent.
- **Consequences:** The skills now work on any project. The tradeoff: they no
  longer encode the specific "docs are durable, code is disposable" methodology
  of the original project — that framing was project-specific and out of scope
  for a shared skill library.

## DEC-003: v1.0.0 tag pointed at the wrong commit — twice — before it was fixed
- **Date:** 2026-07-05
- **Status:** decided
- **Context:** After PR #1 merged, `v1.0.0` was tagged, but PR #2 (CI + tools) merged
  moments later — so the tag silently pointed at the pre-CI, pre-tools commit with
  no GitHub Release attached yet. The first fix attempt (`git tag -a v1.0.0 ...
  origin/main` after deleting the *remote* tag) failed silently: the *local* tag
  still existed from the earlier attempt, so `git tag -a` errored with "tag already
  exists" and the subsequent plain push just re-uploaded the same stale local tag —
  producing a byte-identical "fix" that fixed nothing.
- **Options considered:** N/A — this was a struggle/bug hunt, not a design choice.
- **Decision (outcome):** Root cause was the local tag ref, not the remote one.
  Deleting the *local* tag (`git tag -d v1.0.0`) before recreating it against
  `origin/main`, then force-pushing, resolved it. Verified by dereferencing the
  remote tag object directly (`git cat-file -p`) rather than trusting push output.
- **Consequences:** When a tag "fix" produces identical output (same object SHA,
  same timestamp), suspect a stale local ref before assuming the remote rejected
  the push. Verify tag state by dereferencing the object, not by reading push logs.

## DEC-004: Commit authorship convention flipped — Adrian as author, Claude as trailer
- **Date:** 2026-07-24
- **Status:** decided
- **Context:** Early in this repo's history, commits were authored as `Claude
  <noreply@anthropic.com>` with `Co-Authored-By: Adrian Tame` as a trailer. Adrian
  directly edited `AGENTS.md` to invert this (aligning with his global dotfiles
  CLAUDE.md convention): commits should be authored as `Adrian TJ
  <adrian.tame.jacobo@gmail.com>` with `Co-Authored-By: Claude <noreply@anthropic.com>`
  as the trailer instead. PR bodies also dropped any "Generated with…"/attribution
  block.
- **Options considered:** N/A — directive from the repo owner, not a design choice.
- **Decision:** Follow the new convention for all commits/PRs in this repo going
  forward.
- **Consequences:** Older commits in this repo's history predate the convention and
  are not being rewritten; only new commits follow it.

## DEC-005: Skill-library evaluation against Anthropic's official Skill authoring
  best practices and Building Effective Agents — findings from actually running
  the skills, not just reading them
- **Date:** 2026-07-24
- **Status:** decided
- **Context:** Asked to find authoritative sources on agentic design patterns and
  evaluate this repo's skill library against them — and to actually execute the
  skills against real data rather than only reading the text. Grounded the rubric
  in Anthropic's own "Skill authoring best practices" doc (description clarity,
  degree-of-freedom matching, progressive disclosure, workflows/feedback loops,
  no assumed tool installs) and "Building Effective Agents" (workflow-pattern
  composability). Then ran 8 of the 14 skills end-to-end against a real 600-row
  synthetic dataset and this repo itself.
- **Options considered:** N/A — investigation, not a design choice.
- **Decision (findings, all independently verified, not assumed):**
  1. Nearly every CLI tool the data-science skills name (csvkit, datamash, gnuplot,
     GNU parallel, sqlite3) was **not pre-installed** in a stock environment —
     only `python3`/`jq`/`shuf` were present. None of the skills mention
     installing them, the exact anti-pattern Anthropic's guide warns against
     ("don't assume packages are available").
  2. `explore-data`'s example `datamash groupby` command **silently produces wrong
     aggregates on unsorted input** — datamash requires the input pre-sorted by
     the group column, which the skill never states. Verified concretely: customer
     70 has 11 real orders but the documented command fragments it into 10 separate
     wrong "groups" (mostly count=1) with no error.
  3. `write-sql`'s bundled `scripts/explain.sh` hardcodes `EXPLAIN ANALYZE`, which
     is Postgres/MySQL-only syntax — it throws a bare parser error against SQLite
     (`EXPLAIN` or `EXPLAIN QUERY PLAN` only), with no dialect guard or helpful
     message.
  4. `model-data` lists `rush` alongside `Rscript`/`python -c` as a tool to "keep
     fits scriptable" — but `rush` (shenwei356/rush) is a parallel job executor,
     unrelated to statistical modeling. Likely confusion with `parallelize-pipeline`.
     (`Rio`, referenced in `chart-viz`, checked out fine — it's Jeroen Janssens' own
     CLI-R wrapper from the *Data Science at the Command Line* book these skills
     are modeled on.)
  5. `obtain-data` recommends `curl`/`wget` for hitting APIs generally, correct for
     public URLs (verified working), but doesn't flag that connected services
     (e.g. GitHub in this harness) are blocked at the proxy level and must go
     through their dedicated MCP tool instead — inconsistent with this repo's own
     `connections/*.md` philosophy of preferring declared MCP servers.
  6. Two skills have **zero eval coverage** anywhere in the repo: `obtain-data` and
     `chart-viz` — no `skill_loaded` assertion references either, despite both
     being composed by multiple agents.
  7. `sync-docs`'s primary example ("commonly a top-level `docs/`") didn't match
     this repo's own layout (docs live at the root as `README.md`/`AGENTS.md`, no
     `docs/` dir existed until this entry created one) — the "respect whatever
     convention" fallback has no concrete guidance for recognizing that case.
  8. Confirmed working cleanly end-to-end with no issues: `chart-viz`,
     `parallelize-pipeline` (dry-run → joblog → count reconciliation matched
     exactly), `validate-results` (correctly confirmed two true claims rather than
     rubber-stamping), and `model-data`'s core baseline/split/uncertainty discipline
     (one gap: step 3 gives a concrete example for the random split it says *not*
     to use for time series, but no concrete example for the date-cutoff split it
     recommends instead).
- **Consequences:** Fixes for #2, #3, #4, #5, #7 applied directly in this session:
  `explore-data` now requires `csvsort` before `datamash groupby`; `explain.sh`
  takes an `EXPLAIN_KEYWORD` override (verified against SQLite); `model-data` drops
  `rush` and adds a concrete date-cutoff split example; `obtain-data` now says to
  prefer a declared connection/MCP tool over raw `curl` for connected services;
  `sync-docs` now checks root-level `README.md`/`AGENTS.md` when no `docs/` dir
  exists. #6 fixed with two new eval specs (`obtain-before-explore`,
  `chart-has-one-message`) — all 14 skills now have `skill_loaded` coverage
  somewhere in the suite. #1 (missing CLI tools) was not "fixed" — it's an
  environment-provisioning gap, not something a skill file can fix; noting it here
  is the record. None of this invalidates the skill library's design — the
  workflows that were exercised (parallelize-pipeline, model-data's core
  discipline, validate-results, chart-viz) held up well as originally written;
  the gaps were in specific example commands and unstated environment
  assumptions, not the underlying approach.
