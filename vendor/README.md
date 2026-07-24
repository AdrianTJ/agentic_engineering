# vendor/

Third-party content, vendored as git submodules. Not owned by this repo — a
declarative pointer to upstream, same spirit as `connections/*.md`.

## anthropic-skills

Source: https://github.com/anthropics/skills (Apache License 2.0; each vendored
skill carries its own `LICENSE.txt` — left intact, never stripped).

Pinned to a commit like any submodule; `bin/generate.sh` resolves a skill name here
as a third fallback, after this repo's own `skills/<name>` and `skills/*/<name>`
(see `bin/generate.sh`'s skill-resolution comment and `AGENTS.md`).

**Why vendor instead of relying on the native product feature:** `docx`/`pdf`/`pptx`
/`xlsx`/`skill-creator` are already built into Claude Code and claude.ai — zero setup
there. Vendoring gives the *other* harnesses this repo targets (Codex, Pi, OpenCode,
Hermes) the same skills via the ordinary generator pipeline.

**Update:** `.github/workflows/sync-anthropic-skills.yml` checks weekly and opens a PR
when upstream moves. To update manually:
```sh
git submodule update --remote vendor/anthropic-skills
```

**Which skills are actually referenced from this repo** (see each for why): `skill-
creator` (`write-skill`'s hand-off), `pptx` (`build-deck`'s), `xlsx` (`scrub-data`'s).
`docx` and `pdf` are vendored for availability but nothing hands off to them yet.
