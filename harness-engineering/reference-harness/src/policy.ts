import type { State, Decision, BlastRadius } from "./types.ts";
import { readLog } from "./log.ts";

// ─────────────────────────────────────────────────────────────────────────────
// The policy engine.  A worked SEAM(Ch.9).
//
// Shape borrowed from CaMeL (Debenedetti et al., "Defeating Prompt Injections by
// Design"): the MODEL PROPOSES, a DETERMINISTIC ENGINE OUTSIDE THE MODEL DECIDES.
// Nothing here asks the model whether an action is safe, because a model that has
// read attacker-controlled text is exactly the wrong thing to ask.
//
// This is CaMeL's *structure*, not its mechanism. CaMeL extracts control and data
// flow from the trusted query and enforces capabilities in a custom interpreter.
// This is a coarse approximation: per-tool blast radius plus one taint bit. It
// demonstrates the pattern; it does not deliver CaMeL's guarantees.
//
// Try:  node harness.ts                      (policy on, default)
//       POLICY_OFF=1 node harness.ts         (policy off — watch the trifecta close)
//       APPROVE=all node harness.ts          (stand in for the human)
// ─────────────────────────────────────────────────────────────────────────────


/**
 * Stands in for the human. `APPROVE=all` approves everything; `APPROVE=N`
 * approves at most N times in total, so you can watch a budget actually bind.
 */
export function humanApproves(s: State): boolean {
  const v = process.env.APPROVE;
  if (!v) return false;
  if (v === "all") return true;
  const cap = Number(v);
  if (!Number.isFinite(cap)) return false;
  return readLog().filter((e) => e.t === "approval_granted").length < cap;
}


/**
 * Does this payload derive from a value labelled untrusted?
 *
 * A crude data-flow check: tokenise every untrusted result and see whether the
 * outbound payload carries any of its distinctive words. Crude on purpose — the
 * point is that the question is "does THIS VALUE flow out?", not "did we ever
 * touch anything untrusted".
 *
 * Its limits are the argument for CaMeL doing this properly in an interpreter:
 * this misses laundering (summarise the file, then send the summary) and will
 * false-positive on coincidental vocabulary. A substring test is not a taint
 * analysis. It is, however, strictly better than a run-wide bit, and its failure
 * modes are legible — which is the most you should claim for it.
 *
 * COMPLEXITY: O(untrusted values x result length x payload length). Fine for a
 * demo, wrong for anything real — do not lift this into production. A real
 * implementation propagates labels along assignments rather than re-scanning
 * history on every call.
 */
export function derivesFromUntrusted(payload: string, s: State): string | null {
  const hay = payload.toLowerCase();
  for (const [key, label] of s.provenance) {
    if (label !== "untrusted") continue;
    const result = s.applied.get(key) ?? "";
    const marks = result.toLowerCase().split(/[^a-z0-9.-]+/).filter((w) => w.length >= 6);
    for (const m of marks) if (hay.includes(m)) return key;
  }
  return null;
}

/** Ch.9: the worst thing one call can do. The unit approval gates are sized in. */
type BlastRadius = "read" | "write" | "external";

export const BLAST: Record<string, BlastRadius> = {
  read_file: "read",
  flaky_check: "read",
  write_note: "write",
  escape_workspace: "write",   // classified benignly ON PURPOSE — see the tool
  post_webhook: "external",
};

/** Tools whose output is attacker-influenceable. Reading one taints the run. */
export const UNTRUSTED_SOURCES = new Set(["read_file"]);

export const toolOf = (key: string): string => key.split(":")[1] ?? "";

type Decision =
  | { verdict: "allow" }
  | { verdict: "deny"; reason: string }
  | { verdict: "approve"; reason: string };

/**
 * The whole policy, deterministic and readable in one screen — which is the
 * point. If you cannot read your authorization rules in one sitting, you do not
 * know what your agent is allowed to do.
 */
export function authorize(call: { tool: string; args: string; key: string }, s: State): Decision {
  if (process.env.POLICY_OFF) return { verdict: "allow" };

  const radius = BLAST[call.tool];
  if (!radius) return { verdict: "deny", reason: `unknown tool '${call.tool}' — deny by default` };

  // THE TRIFECTA CHECK (Ch.9, Willison). Private data + untrusted content +
  // external communication. We cannot remove the first two, so we cut the third
  // — but only for the flows that actually carry untrusted data. Decided here,
  // deterministically, never by asking the model that read the untrusted text.
  if (radius === "external") {
    const src = derivesFromUntrusted(call.args, s);
    if (src) {
      return {
        verdict: "deny",
        reason: `egress blocked: payload derives from untrusted value ${src} (lethal trifecta)`,
      };
    }
  }

  // Blast-radius gate: anything that leaves the process needs a human.
  if (radius === "external") {
    return { verdict: "approve", reason: "external communication requires approval" };
  }

  return { verdict: "allow" };
}

