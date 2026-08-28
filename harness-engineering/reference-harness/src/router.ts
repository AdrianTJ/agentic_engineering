import type { State, ModelDecision } from "./types.ts";

// ─────────────────────────────────────────────────────────────────────────────
// The router.  A worked SEAM(Ch.3).
//
// Ch.3's central question is per-decision: does YOUR CODE decide the next step,
// or does the MODEL? Every edge you can make static is a model call you do not
// pay for, cannot get wrong, and can unit-test.
//
// This router handles one mechanical case — continuing a sequential scan — and
// defers everything else to the model. That division is the design: static where
// the rule is enumerable, dynamic where it is not.
//
// Try:  SCRIPT=long node harness.ts              (all dynamic)
//       ROUTER=on SCRIPT=long node harness.ts    (static where it can be)
// ─────────────────────────────────────────────────────────────────────────────

export function route(s: State): { decision: ModelDecision; rule: string } | null {
  if (process.env.ROUTER !== "on") return null;

  // Rule: once a sequential scan is under way, the next file is arithmetic.
  // Asking a model to compute N+1 is paying frontier prices for a successor
  // function.
  const last = [...s.applied.keys()].at(-1) ?? "";
  const m = last.match(/read_file:file-(\d+)\.md$/);
  if (m) {
    const next = Number(m[1]) + 1;
    return {
      decision: { kind: "call_tool", tool: "read_file", args: `file-${next}.md` },
      rule: "sequential-scan",
    };
  }
  return null;
}

