#!/usr/bin/env bash
#
# run-sandboxed.sh — run the harness with runtime-enforced filesystem containment.
#
# Ch.9 distinguishes AUTHORIZATION (the policy decides what the agent may ask
# for) from CONTAINMENT (the runtime decides what it can actually do). They are
# different layers and you need both: authorize() is code the agent's own tools
# could in principle be written around, whereas this boundary is enforced
# beneath them.
#
#   ./run-sandboxed.sh SCRIPT=escape     → blocked by the runtime
#   SCRIPT=escape node harness.ts        → succeeds; the policy permitted it
#
# This uses Node's permission model, which is a RUNTIME boundary, not an OS one.
# It is stronger than a path check inside the tool (which the tool could skip)
# and weaker than a container (which also bounds CPU, memory, network, and
# syscalls). Ch.9's point about MCP Roots applies to this too: know which kind of
# boundary you have.

set -uo pipefail
cd "$(dirname "$0")"
mkdir -p .state
exec env "$@" node \
  --experimental-permission \
  --allow-fs-read="$(pwd)" \
  --allow-fs-write="$(pwd)/.state" \
  harness.ts
