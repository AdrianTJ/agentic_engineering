// Contracts. See ../SPEC.md — these types are the spec, in code.

// ─────────────────────────────────────────────────────────────────────────────
// Contracts.  See SPEC.md — these types are the spec, in code.
// ─────────────────────────────────────────────────────────────────────────────

/** Everything that happens is an event. The log is the state. (Ch.6) */
export type Event =
  | { t: "run_started"; goal: string; at: string }
  | {
      t: "model_called";
      step: number;
      tokens: number;
      /** Per-block fingerprints, so the next turn can compute its cache prefix. */
      blocks: { label: string; hash: string; tokens: number }[];
      cached: number;
      fresh: number;
    }
  | { t: "routed_statically"; step: number; tool: string; rule: string }
  | { t: "tool_requested"; step: number; tool: string; args: string; key: string }
  | { t: "tool_succeeded"; step: number; key: string; result: string }
  | { t: "tool_failed"; step: number; key: string; error: string }
  | { t: "context_compacted"; step: number; droppedTokens: number; keptContract: string[] }
  | { t: "context_reset"; step: number; droppedTokens: number; handoffBytes: number }
  | { t: "tool_denied"; step: number; tool: string; reason: string }
  | { t: "approval_required"; step: number; tool: string; args: string; key: string }
  | { t: "approval_granted"; step: number; key: string; by: string; uses: number }
  | { t: "approval_consumed"; step: number; key: string }
  | { t: "claimed_done"; step: number; summary: string }
  | { t: "run_stopped"; reason: StopReason; at: string };

export type StopReason =
  | "goal_satisfied"
  | "step_budget_exhausted"
  | "token_budget_exhausted"
  | "no_progress"
  | "human_halt";

/** Derived by folding the log. Never mutated in place, never trusted from memory. */
export type State = {
  goal: string | null;
  step: number;
  tokens: number;
  /** Idempotency ledger: tool calls whose effect has already been applied. (Ch.6) */
  applied: Map<string, string>;
  /** Raw history. What the model actually SEES is derived from this by the
   *  context policy below — the two are not the same thing. (Ch.4) */
  transcript: string[];
  /** What compaction preserved. Grows; never silently drops a contract item. (Ch.4) */
  retained: string[];
  /** Transcript entries before this index have been compacted away. (Ch.4) */
  compactedThrough: number;
  /** True once the window has been reset; history is then the handoff. (Ch.10) */
  wasReset: boolean;
  /**
   * PER-VALUE PROVENANCE, not a run-wide taint bit. (Ch.9)
   *
   * Maps a value's label -> whether it is attacker-influenceable. A single
   * run-wide bit is what the pass-05 version had, and it was unusable: one
   * `read_file` poisoned the whole run, so a legitimate egress an hour later was
   * blocked forever with no way back. Real systems need to know WHICH VALUES are
   * tainted, which is CaMeL's actual contribution rather than its silhouette.
   */
  provenance: Map<string, "trusted" | "untrusted">;
  /**
   * Approvals, keyed by LOGICAL identity (`tool:args`) — not by the step-scoped
   * idempotency key. The two ledgers answer different questions:
   *
   *   idempotency key (step:tool:args) — "did THIS OCCURRENCE already happen?"
   *   approval key    (tool:args)      — "did a human bless THIS ACTION?"
   *
   * Keying approvals by occurrence means a retrying agent re-prompts a human for
   * an identical action. Keying idempotency by action would silently swallow a
   * second, legitimately-intended write. They must be keyed differently.
   *
   * And the value is a BUDGET, not a boolean. A boolean approval is a standing
   * permit: approve one webhook post and the agent may post forever. An approval
   * authorises N executions — almost always 1. (Ch.9)
   */
  approvals: Map<string, number>;
  /** Set when the run is parked waiting on a human. (Ch.6 durable wait) */
  awaiting: { tool: string; args: string; key: string } | null;
  /** Cache accounting, folded from the log. (Ch.7) */
  cachedTokens: number;
  freshTokens: number;
  billedTokens: number;
  lastBlocks: { label: string; hash: string; tokens: number }[];
  /** For no-progress detection. (Ch.2) */
  recentSignatures: string[];
  /**
   * A tool call that was logged but whose outcome never was — i.e. we died
   * between intent and effect. Recovery MUST finish this before asking the model
   * anything, or the work is silently dropped. (Ch.6)
   */
  pending: { step: number; tool: string; args: string; key: string } | null;
  lastError: string | null;
  stopped: StopReason | null;
};

export type Tool = {
  name: string;
  description: string;
  /** Side-effecting tools must be idempotent given the same key. (Ch.6) */
  run: (args: string) => Promise<string>;
};

export type ModelDecision =
  | { kind: "call_tool"; tool: string; args: string }
  | { kind: "done"; summary: string };

export type ModelProvider = {
  /** Swap this one function for a real SDK call. SEAM(Ch.11 / Ch.12) */
  decide: (state: State, tools: Tool[]) => Promise<{ decision: ModelDecision; tokens: number }>;
};

export type Budgets = { maxSteps: number; maxTokens: number; noProgressWindow: number };

