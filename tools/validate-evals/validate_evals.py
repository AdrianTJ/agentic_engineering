#!/usr/bin/env python3
"""Validate agents/*/eval/*.eval.yaml against shared/eval-spec.md.

Exit 0 only if every spec passes. No arguments; repo root is derived from this
file's location (tools/validate-evals/ -> repo root two levels up).
"""
import re
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_KEYS = {"name", "description", "prompt", "expect"}
ASSERTION_VOCAB = {
    "skill_loaded",
    "connection_used",
    "tool_called",
    "reply_contains",
    "reply_not_contains",
    "reply_matches",
}


def check(spec_path: Path, seen_names: set) -> list:
    errors = []
    try:
        spec = yaml.safe_load(spec_path.read_text())
    except yaml.YAMLError as exc:
        return [f"not valid YAML: {exc}"]
    if not isinstance(spec, dict):
        return ["top level must be a mapping"]

    missing = REQUIRED_KEYS - spec.keys()
    if missing:
        errors.append(f"missing keys: {sorted(missing)}")

    name = spec.get("name")
    if name:
        if name != spec_path.name.removesuffix(".eval.yaml"):
            errors.append(f"name '{name}' != filename stem")
        if name in seen_names:
            errors.append(f"duplicate name '{name}' within this agent")
        seen_names.add(name)

    for assertion in spec.get("expect") or []:
        if not isinstance(assertion, dict) or len(assertion) != 1:
            errors.append(f"assertion must be a single key: value pair: {assertion!r}")
            continue
        key, value = next(iter(assertion.items()))
        if key not in ASSERTION_VOCAB:
            errors.append(f"unknown assertion '{key}' (vocabulary: {sorted(ASSERTION_VOCAB)})")
        elif key == "reply_matches":
            try:
                re.compile(str(value))
            except re.error as exc:
                errors.append(f"reply_matches regex does not compile: {exc}")

    for fixture in spec.get("fixtures") or []:
        if not (REPO_ROOT / fixture).exists():
            errors.append(f"fixture not found: {fixture}")

    return errors


def main() -> int:
    specs = sorted(REPO_ROOT.glob("agents/*/eval/*.eval.yaml"))
    if not specs:
        print("no eval specs found under agents/*/eval/", file=sys.stderr)
        return 1

    failed = False
    seen_per_agent = {}
    for spec_path in specs:
        agent = spec_path.parent.parent.name
        errors = check(spec_path, seen_per_agent.setdefault(agent, set()))
        rel = spec_path.relative_to(REPO_ROOT)
        if errors:
            failed = True
            print(f"FAIL {rel}")
            for err in errors:
                print(f"     - {err}")
        else:
            print(f"OK   {rel}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
