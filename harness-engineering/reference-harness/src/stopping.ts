import type { State, StopReason, Budgets } from "./types.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Stopping conditions.  Four of them, none optional. (Ch.2)
// ─────────────────────────────────────────────────────────────────────────────

export function budgetStop(s: State, b: Budgets): StopReason | null {
  if (s.step >= b.maxSteps) return "step_budget_exhausted";
  if (s.tokens >= b.maxTokens) return "token_budget_exhausted";
  // No-progress: the last N tool calls were all identical. (Ch.2)
  const recent = s.recentSignatures.slice(-b.noProgressWindow);
  if (recent.length === b.noProgressWindow && new Set(recent).size === 1) {
    return "no_progress";
  }
  // SEAM(Ch.7): a cost budget belongs here, denominated in money.
  return null;
}

/**
 * Does a "done" claim survive checking? (Ch.10)
 *
 * A real implementation verifies deterministically where it can — exit codes,
 * tests, schema checks — and only then asks a model, in a FRESH context, judging
 * against the original goal rather than the conversation. Ch.8 and Ch.10.
 */
export async function verifyDone(s: State): Promise<boolean> {
  // SEAM(Ch.8/Ch.10): replace with real verification + a fresh-context evaluator.
  return s.applied.size > 0;
}

