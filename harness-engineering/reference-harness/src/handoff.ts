/**
 * The handoff artifact.  A worked SEAM(Ch.10).
 *
 * Ch.4 keeps work alive across a context window by compacting. Ch.10 reports
 * that teams running the longest tasks do something else: they **reset** the
 * window entirely and hand off through a structured document.
 *
 * The difference is not cosmetic. Compaction produces a lossy *continuation*;
 * a reset produces a clean slate plus an explicit *contract about what mattered*.
 * The second is auditable — you can read HANDOFF.md and say whether it is enough
 * — and the first is not, because what compaction dropped is by construction no
 * longer visible.
 *
 * Schema is SPEC.md §7. Every field answers a question a fresh session would
 * otherwise have to re-derive, which is the test for whether a field belongs.
 */

import type { State } from "./types.ts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STATE_DIR } from "./paths.ts";

export const HANDOFF_PATH = join(STATE_DIR, "HANDOFF.md");

/**
 * Rendered from state on every write, never appended to — a handoff that
 * accumulates is just a transcript with extra steps.
 */
/**
 * How many completed effects the handoff lists individually.
 *
 * This constant is the whole lesson. The first version had no bound, and the
 * artifact grew every step until it filled the window on its own — resets fired
 * ten times in a twenty-step run, each one handing off a slightly larger
 * document. A handoff that accumulates is a transcript with extra steps, which
 * this file's own docstring said before the code did it anyway.
 *
 * Bounding it is lossy, and that is the point: **a context reset does not escape
 * the retention problem, it relocates it.** Compaction decides what to drop
 * inside an opaque summary; a handoff decides it in a file you can read. The
 * second is auditable. Neither is free.
 */
const KEEP_DONE = 5;

export function renderHandoff(s: State): string {
  const all = [...s.applied.values()];
  const done = all.slice(-KEEP_DONE);
  const elided = all.length - done.length;
  return [
    `# Handoff`,
    ``,
    `## Goal`,
    s.goal ?? "(none)",
    ``,
    `## Constraints`,
    `- Stop when the goal is met; do not re-do completed work.`,
    ``,
    `## Done (do not repeat)`,
    ...(elided > 0 ? [`- (+${elided} earlier effects, elided — see events.jsonl)`] : []),
    ...(done.length ? done.map((d) => `- ${d}`) : ["- (nothing yet)"]),
    ``,
    `## Failed (do not retry blindly)`,
    s.lastError ? `- ${s.lastError}` : `- (nothing yet)`,
    ``,
    `## Current state`,
    `- step ${s.step}, ${s.applied.size} effect(s) applied`,
    ``,
    `## Next action`,
    `- continue toward the goal from the facts above`,
    ``,
    `## Open questions`,
    `- (none recorded)`,
  ].join("\n");
}

export function writeHandoff(s: State): void {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(HANDOFF_PATH, renderHandoff(s) + "\n");
}

export const readHandoff = (): string =>
  existsSync(HANDOFF_PATH) ? readFileSync(HANDOFF_PATH, "utf8") : "";
