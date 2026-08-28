import type { State, Policy, ContextView } from "./types.ts";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { STATE_DIR } from "./paths.ts";
import { tools } from "./tools.ts";
import { append, readLog, rebuild } from "./log.ts";
import { readHandoff, writeHandoff } from "./handoff.ts";

// ─────────────────────────────────────────────────────────────────────────────
// The context policy.  A worked SEAM(Ch.4) — the pattern the other seams follow.
//
// This is the only part of the harness that decides WHAT THE MODEL SEES. The
// transcript is raw history; the context is a derived, budgeted view of it.
// Conflating the two is the most common Ch.4 mistake.
//
// Try:  POLICY=none node harness.ts     (no policy — watch occupancy climb)
//       POLICY=compact node harness.ts  (compaction only)
//       POLICY=full node harness.ts     (compaction + tool clearing + notes)  [default]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `clear` exists to isolate a variable: it is `full` minus the notes block, so
 * `compact` vs `clear` differs ONLY in tool clearing. Comparing `compact` to
 * `full` confounds two changes at once, which is how the first version of this
 * measurement nearly drew a clean conclusion from a dirty experiment.
 */
type Policy = "none" | "compact" | "clear" | "full";
export const POLICY = (process.env.POLICY ?? "full") as Policy;

/** Rough but honest: ~4 chars per token. Replace with the provider's counter. */
export const estimate = (s: string): number => Math.ceil(s.length / 4);

export const SYSTEM_PROMPT = "You are a coding agent. Work the goal; stop when it is done.";
export const WINDOW = 400;                // deliberately tiny, so policy effects are visible
export const COMPACT_AT = 0.7;            // compact at 70% occupancy (Ch.4)
export const KEEP_TOOL_RESULTS = 2;       // tool clearing horizon, in steps (Ch.4)

/**
 * THE RETENTION CONTRACT (Ch.4).
 *
 * The explicit list of what compaction may never drop. Written down, because a
 * compaction policy without one is just amnesia with extra steps. Everything
 * here survives; everything else is negotiable.
 */
export function retentionContract(s: State): string[] {
  return [
    `GOAL: ${s.goal}`,
    // What has been tried and what it cost — so the agent does not redo it.
    ...[...s.applied.values()].map((r) => `DONE: ${r}`),
    // Failures are contract items: repeating a known-failing call is the
    // classic post-compaction regression.
    ...(s.lastError ? [`FAILED: ${s.lastError}`] : []),
  ];
}

type ContextView = {
  blocks: { label: string; text: string; tokens: number }[];
  total: number;
  occupancy: number;
};

/** Build what the model sees, and account for it by category. (Ch.4, Ch.7) */
export function buildContext(s: State): ContextView {
  const notes = existsSync(join(STATE_DIR, "NOTES.md"))
    ? readFileSync(join(STATE_DIR, "NOTES.md"), "utf8")
    : "";

  let history = s.transcript;
  if (POLICY !== "none") {
    // Only the un-compacted tail is replayed verbatim; the rest is `retained`.
    history = history.slice(s.compactedThrough);
  }
  if (POLICY === "full" || POLICY === "clear") {
    // Tool clearing: drop stale tool results, keep the calls that produced them,
    // so the agent still knows what it did without re-reading every result.
    const cutoff = s.step - KEEP_TOOL_RESULTS;
    history = history.filter((line) => !(line.startsWith("  -> ") && lineStep(line, history) < cutoff));
  }

  // ORDERING IS A CACHE DECISION, NOT A STYLE DECISION (Ch.7).
  // Static first, volatile last, so the cached prefix stays stable.
  const blocks = [
    { label: "system", text: SYSTEM_PROMPT },
    { label: "tools", text: tools.map((t) => `${t.name}: ${t.description}`).join("\n") },
    { label: "retained", text: s.retained.join("\n") },
    // After a reset the handoff artifact IS the context. (Ch.10)
    { label: "handoff", text: s.wasReset ? readHandoff() : "" },
    { label: "notes", text: POLICY === "full" ? notes : "" },
    { label: "history", text: history.join("\n") },
  ].map((b) => ({ ...b, tokens: estimate(b.text) }));

  const total = blocks.reduce((n, b) => n + b.tokens, 0);
  return { blocks, total, occupancy: total / WINDOW };
}

/** Which step a transcript line belongs to; used only for tool clearing. */
export function lineStep(line: string, history: string[]): number {
  const i = history.indexOf(line);
  for (let j = i; j >= 0; j--) {
    const m = history[j]?.match(/^step (\d+):/);
    if (m) return Number(m[1]);
  }
  return 0;
}

/** Compact if over threshold, honouring the contract. Logged, so it is auditable. */
export function maybeCompact(s: State): State {
  if (POLICY === "none") return s;

  // The handoff is maintained continuously, not written at the end — an agent
  // that only writes it on the way out may never get there. (Ch.10)
  if (POLICY === "reset") writeHandoff(s);

  const view = buildContext(s);
  if (view.occupancy < COMPACT_AT) return s;

  if (POLICY === "reset") {
    // Clear the window entirely and continue from the artifact alone. (Ch.10)
    const dropped = estimate(s.transcript.slice(s.compactedThrough).join("\n"));
    writeHandoff(s);
    const bytes = readHandoff().length;
    append({ t: "context_reset", step: s.step, droppedTokens: dropped, handoffBytes: bytes });
    console.log(`  ⭯ context reset: dropped ~${dropped} tokens, handoff is ${bytes} bytes`);
    return rebuild(readLog());
  }

  const contract = retentionContract(s);
  const dropped = estimate(s.transcript.slice(s.compactedThrough).join("\n"));
  append({ t: "context_compacted", step: s.step, droppedTokens: dropped, keptContract: contract });
  console.log(`  ⇊ compacted: dropped ~${dropped} tokens, kept ${contract.length} contract items`);
  return rebuild(readLog());
}

/** Per-run context report. This is the measurement Ch.4's exercise asks for. */
export function report(s: State): void {
  const v = buildContext(s);
  const compactions = readLog().filter((e) => e.t === "context_compacted").length;
  const resets = readLog().filter((e) => e.t === "context_reset").length;
  console.log(`\ncontext report (POLICY=${POLICY})`);
  for (const b of v.blocks) {
    if (b.tokens) console.log(`  ${b.label.padEnd(9)} ${String(b.tokens).padStart(5)} tok`);
  }
  console.log(`  ${"TOTAL".padEnd(9)} ${String(v.total).padStart(5)} tok  (${(v.occupancy * 100).toFixed(0)}% of ${WINDOW})`);
  console.log(`  compactions: ${compactions}  resets: ${resets}`);
  const log = readLog();
  const modelCalls = log.filter((e) => e.t === "model_called").length;
  const routed = log.filter((e) => e.t === "routed_statically").length;
  console.log(`  model calls: ${modelCalls}  statically routed: ${routed}`);
  const hitRate = s.cachedTokens + s.freshTokens > 0
    ? (s.cachedTokens / (s.cachedTokens + s.freshTokens)) * 100 : 0;
  console.log(
    `  cache: ${s.cachedTokens} cached / ${s.freshTokens} fresh ` +
    `(${hitRate.toFixed(0)}% hit)  billed: ${s.billedTokens} tok`,
  );
}

