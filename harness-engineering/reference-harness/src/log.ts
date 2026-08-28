import type { Event, State } from "./types.ts";
import { STATE_DIR, LOG_PATH } from "./paths.ts";
import { UNTRUSTED_SOURCES, toolOf } from "./policy.ts";
import { billed } from "./cache.ts";

// ─────────────────────────────────────────────────────────────────────────────
// The event log.  Append before acting; rebuild by folding. (Ch.6)
// ─────────────────────────────────────────────────────────────────────────────

import { appendFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";


export function append(e: Event): void {
  mkdirSync(STATE_DIR, { recursive: true });
  appendFileSync(LOG_PATH, JSON.stringify(e) + "\n");
}

export function readLog(): Event[] {
  if (!existsSync(LOG_PATH)) return [];
  return readFileSync(LOG_PATH, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as Event);
}

/** The reducer. (state, event) -> state. Pure; no I/O. (Ch.6, 12-factor #12) */
export function reduce(s: State, e: Event): State {
  switch (e.t) {
    case "run_started":
      return { ...s, goal: e.goal };
    case "model_called":
      return {
        ...s,
        step: e.step,
        tokens: s.tokens + e.tokens,
        cachedTokens: s.cachedTokens + e.cached,
        freshTokens: s.freshTokens + e.fresh,
        billedTokens: s.billedTokens + billed(e.cached, e.fresh),
        lastBlocks: e.blocks,
        lastChunks: e.chunks ?? [],
      };
    case "routed_statically":
      // A static edge costs a step but no tokens — that is the whole point. (Ch.3)
      return { ...s, step: e.step };
    case "tool_requested":
      return {
        ...s,
        pending: { step: e.step, tool: e.tool, args: e.args, key: e.key },
        transcript: [...s.transcript, `step ${e.step}: call ${e.tool}(${e.args})`],
        recentSignatures: [...s.recentSignatures, `${e.tool}(${e.args})`],
      };
    case "tool_succeeded": {
      const applied = new Map(s.applied).set(e.key, e.result);
      return {
        ...s,
        applied,
        // Label THIS value, rather than poisoning the whole run. (Ch.9)
        provenance: new Map(s.provenance).set(
          e.key,
          UNTRUSTED_SOURCES.has(toolOf(e.key)) ? "untrusted" : "trusted",
        ),
        pending: s.pending?.key === e.key ? null : s.pending,
        lastError: null,
        transcript: [...s.transcript, `  -> ${e.result}`],
      };
    }
    case "tool_failed":
      // Error compaction: one line, and never the same error twice running. (Ch.2)
      return {
        ...s,
        pending: s.pending?.key === e.key ? null : s.pending,
        lastError: e.error,
        transcript:
          s.lastError === e.error
            ? s.transcript
            : [...s.transcript, `  -> ERROR: ${e.error}`],
      };
    case "context_compacted":
      return { ...s, retained: e.keptContract, compactedThrough: s.transcript.length };
    case "context_reset":
      // A reset drops the transcript entirely. What survives is the handoff
      // artifact on disk, which is the point: state lives in files. (Ch.10)
      return { ...s, retained: [], compactedThrough: s.transcript.length, wasReset: true };
    case "tool_denied":
      return {
        ...s,
        pending: null,
        // A denial is context: the agent must learn it, or it will retry forever.
        transcript: [...s.transcript, `  -> DENIED: ${e.reason}`],
      };
    case "approval_required":
      return { ...s, awaiting: { tool: e.tool, args: e.args, key: e.key } };
    case "approval_granted": {
      const a = new Map(s.approvals);
      a.set(e.key, (a.get(e.key) ?? 0) + e.uses);
      return { ...s, approvals: a, awaiting: null };
    }
    case "approval_consumed": {
      const a = new Map(s.approvals);
      a.set(e.key, Math.max(0, (a.get(e.key) ?? 0) - 1));
      return { ...s, approvals: a };
    }
    case "claimed_done":
      return { ...s, transcript: [...s.transcript, `claimed done: ${e.summary}`] };
    case "run_stopped":
      return { ...s, stopped: e.reason };
  }
}

export const EMPTY: State = {
  goal: null, step: 0, tokens: 0, applied: new Map(), transcript: [],
  cachedTokens: 0, freshTokens: 0, billedTokens: 0, lastBlocks: [], lastChunks: [],
  retained: [], compactedThrough: 0, wasReset: false, provenance: new Map(), approvals: new Map(), awaiting: null,
  recentSignatures: [], pending: null, lastError: null, stopped: null,
};

export const rebuild = (events: Event[]): State => events.reduce(reduce, EMPTY);

