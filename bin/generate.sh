#!/usr/bin/env bash
#
# generate.sh — project the canonical, harness-agnostic repo into per-harness layouts.
#
# The repo is the single source of truth. You only ever edit these:
#   AGENTS.md               root agent context (always-on project instructions)
#   skills/<name>/SKILL.md  the shared skill library (write each skill ONCE)
#   agents/<name>/AGENT.md  thin agent manifests: which skills + connections they compose
#   connections/<name>.md   declarative pointers to MCP servers / APIs (env var, never secret)
#
# Each harness wants those files in a different place. Rather than maintain a copy
# per harness, the per-harness LAYOUT is described as data in harnesses/<name>.conf,
# and this script materializes it into dist/<name>/.
#
# Adding a new harness = drop in one harnesses/<name>.conf file. This script never changes.
#
# Usage:
#   bin/generate.sh <harness>        build one harness into dist/<harness>/
#   bin/generate.sh --all            build every harness found in harnesses/
#   bin/generate.sh --copy <harness> materialize real files instead of symlinks
#   bin/generate.sh --list           list available harnesses
#   bin/generate.sh --clean          remove dist/
#
# Defaults to symlinks so edits to the canonical sources are reflected instantly.
# Use --copy when a target environment can't follow symlinks, or to ship a snapshot.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HARNESS_DIR="$REPO_ROOT/harnesses"
DIST_DIR="$REPO_ROOT/dist"
LINK_MODE="symlink"

usage() { sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; }

# Print each item of a frontmatter list block, one per line.
#   parse_list <file> <yaml_key>   e.g. parse_list agent/AGENT.md skills
parse_list() {
  awk -v key="$2" '
    /^---[[:space:]]*$/ { fm = !fm; next }
    fm && $0 ~ "^" key ":[[:space:]]*$" { inlist = 1; next }
    fm && inlist {
      if ($0 ~ /^[[:space:]]+-[[:space:]]+/) {
        line = $0
        sub(/^[[:space:]]+-[[:space:]]+/, "", line)   # strip "  - "
        sub(/[[:space:]]*#.*$/, "", line)             # strip trailing comment
        sub(/[[:space:]]+$/, "", line)                # strip trailing space
        if (line != "") print line
      } else if ($0 ~ /^[^[:space:]]/) {
        inlist = 0                                    # next top-level key ends the list
      }
    }
  ' "$1"
}

# place <src> <dest> — symlink (default) or copy, replacing whatever was there.
place() {
  local src="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  rm -rf "$dest"
  if [ "$LINK_MODE" = "copy" ]; then
    cp -R "$src" "$dest"
  else
    ln -s "$src" "$dest"   # absolute target: robust regardless of nesting depth
  fi
}

build_harness() {
  local harness="$1"
  local conf="$HARNESS_DIR/$harness.conf"
  [ -f "$conf" ] || { echo "error: no such harness '$harness' (looked for $conf)" >&2; return 1; }

  # Layout defaults — a .conf overrides only what differs.
  local SKILLS_DIR="skills"
  local AGENTS_DIR="agents"
  local CONNECTIONS_DIR=""          # empty = this harness has no connections dir; skip
  local INSTRUCTIONS_FILE="AGENTS.md"
  local ALSO_AGENTS_MD="false"
  local AGENT_FILE_EXT="md"
  # shellcheck disable=SC1090
  . "$conf"

  local out="$DIST_DIR/$harness"
  rm -rf "$out"; mkdir -p "$out"

  # 1) Root instructions, named however this harness expects.
  place "$REPO_ROOT/AGENTS.md" "$out/$INSTRUCTIONS_FILE"
  if [ "$ALSO_AGENTS_MD" = "true" ] && [ "$INSTRUCTIONS_FILE" != "AGENTS.md" ]; then
    place "$REPO_ROOT/AGENTS.md" "$out/AGENTS.md"
  fi

  # 2) Each agent's manifest, plus the shared skills and connections it composes.
  local agent_md name skill skdir conn connfile
  for agent_md in "$REPO_ROOT"/agents/*/AGENT.md; do
    [ -e "$agent_md" ] || continue
    name="$(basename "$(dirname "$agent_md")")"
    place "$agent_md" "$out/$AGENTS_DIR/$name.$AGENT_FILE_EXT"

    # 2a) shared skills
    while IFS= read -r skill; do
      [ -n "$skill" ] || continue
      skdir="$REPO_ROOT/skills/$skill"
      if [ -d "$skdir" ]; then
        place "$skdir" "$out/$SKILLS_DIR/$skill"
      else
        echo "  warning: agent '$name' references missing skill '$skill'" >&2
      fi
    done < <(parse_list "$agent_md" skills)

    # 2b) connections (declarative pointers to MCP servers / APIs) — only if this
    #     harness exposes a connections dir. The file names only an env var for any
    #     secret, never the secret itself.
    if [ -n "$CONNECTIONS_DIR" ]; then
      while IFS= read -r conn; do
        [ -n "$conn" ] || continue
        connfile="$REPO_ROOT/connections/$conn.md"
        if [ -f "$connfile" ]; then
          place "$connfile" "$out/$CONNECTIONS_DIR/$conn.md"
        else
          echo "  warning: agent '$name' references missing connection '$conn'" >&2
        fi
      done < <(parse_list "$agent_md" connections)
    fi
  done

  echo "built dist/$harness  (mode: $LINK_MODE)"
}

list_harnesses() {
  for c in "$HARNESS_DIR"/*.conf; do
    [ -e "$c" ] || { echo "(none)"; return; }
    basename "$c" .conf
  done
}

# ---- argument parsing: flags in any order, one action ----
TARGET=""
for arg in "$@"; do
  case "$arg" in
    --copy)  LINK_MODE="copy" ;;
    --all)   TARGET="--all" ;;
    --list)  TARGET="--list" ;;
    --clean) TARGET="--clean" ;;
    -h|--help) TARGET="--help" ;;
    -*)      echo "unknown flag: $arg" >&2; exit 2 ;;
    *)       TARGET="$arg" ;;
  esac
done

case "${TARGET:-}" in
  ""|--help) usage ;;
  --list)    list_harnesses ;;
  --clean)   rm -rf "$DIST_DIR"; echo "removed dist/" ;;
  --all)     for h in $(list_harnesses); do build_harness "$h"; done ;;
  *)         build_harness "$TARGET" ;;
esac
