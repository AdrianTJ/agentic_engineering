#!/usr/bin/env bash
#
# install-hooks.sh — install a pre-commit hook that runs bin/check-all.sh.
#
# Idempotent. Bypass a single commit with `git commit --no-verify` when you
# genuinely mean to (e.g. committing a known-red state deliberately).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOOK="$ROOT/.git/hooks/pre-commit"
mkdir -p "$(dirname "$HOOK")"
cat > "$HOOK" <<'HOOK'
#!/usr/bin/env bash
# Installed by harness-engineering/bin/install-hooks.sh
git diff --cached --name-only | grep -q '^harness-engineering/' || exit 0
echo "running harness-engineering checks (--no-verify to skip)..."
exec harness-engineering/bin/check-all.sh
HOOK
chmod +x "$HOOK"
echo "installed $HOOK"
echo "it runs only when the commit touches harness-engineering/"
