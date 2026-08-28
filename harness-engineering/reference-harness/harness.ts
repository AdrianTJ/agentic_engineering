/**
 * A reference harness skeleton for the harness-engineering curriculum.
 *
 * Run it:      node harness.ts
 * Crash it:    CRASH_AT=3 node harness.ts     (then run again — it resumes)
 * Reset it:    rm -rf .state
 *
 * Requires Node 22.6+ (runs TypeScript directly). No dependencies, no network,
 * no API key: the model is a deterministic stub so the loop is inspectable and
 * the whole thing runs offline in about a second.
 *
 * WHAT THIS IMPLEMENTS (fully):
 *   Ch.2  the loop, four stopping conditions, error compaction
 *   Ch.6  stateless reducer, append-only event log, crash recovery, idempotency
 *
 * WHAT THIS DOES NOT IMPLEMENT (deliberately):
 *   Everything else. Each chapter's "Build this" exercise attaches at a seam
 *   marked `SEAM(Ch.N)` below. The gaps are the curriculum.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Contracts.  See SPEC.md — these types are the spec, in code.
// ─────────────────────────────────────────────────────────────────────────────

/** Everything that happens is an event. The log is the state. (Ch.6) */
type Event =
  | { t: "run_started"; goal: string; at: string }
  | { t: "model_called"; step: number; tokens: number }
  | { t: "tool_requested"; step: number; tool: string; args: string; key: string }
  | { t: "tool_succeeded"; step: number; key: string; result: string }
  | { t: "tool_failed"; step: number; key: string; error: string }
  | { t: "context_compacted"; step: number; droppedTokens: number; keptContract: string[] }
  | { t: "tool_denied"; step: number; tool: string; reason: string }
  | { t: "approval_required"; step: number; tool: string; args: string; key: string }
  | { t: "approval_granted"; step: number; key: string; by: string; uses: number }
  | { t: "approval_consumed"; step: number; key: string }
  | { t: "claimed_done"; step: number; summary: string }
  | { t: "run_stopped"; reason: StopReason; at: string };

type StopReason =
  | "goal_satisfied"
  | "step_budget_exhausted"
  | "token_budget_exhausted"
  | "no_progress"
  | "human_halt";

/** Derived by folding the log. Never mutated in place, never trusted from memory. */
type State = {
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
  /** Has untrusted content entered the context? One leg of the trifecta. (Ch.9) */
  tainted: boolean;
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

type Tool = {
  name: string;
  description: string;
  /** Side-effecting tools must be idempotent given the same key. (Ch.6) */
  run: (args: string) => Promise<string>;
};

type ModelDecision =
  | { kind: "call_tool"; tool: string; args: string }
  | { kind: "done"; summary: string };

type ModelProvider = {
  /** Swap this one function for a real SDK call. SEAM(Ch.11 / Ch.12) */
  decide: (state: State, tools: Tool[]) => Promise<{ decision: ModelDecision; tokens: number }>;
};

type Budgets = { maxSteps: number; maxTokens: number; noProgressWindow: number };

// ─────────────────────────────────────────────────────────────────────────────
// The event log.  Append before acting; rebuild by folding. (Ch.6)
// ─────────────────────────────────────────────────────────────────────────────

import { appendFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const STATE_DIR = ".state";
const LOG_PATH = join(STATE_DIR, "events.jsonl");

function append(e: Event): void {
  mkdirSync(STATE_DIR, { recursive: true });
  appendFileSync(LOG_PATH, JSON.stringify(e) + "\n");
}

function readLog(): Event[] {
  if (!existsSync(LOG_PATH)) return [];
  return readFileSync(LOG_PATH, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as Event);
}

/** The reducer. (state, event) -> state. Pure; no I/O. (Ch.6, 12-factor #12) */
function reduce(s: State, e: Event): State {
  switch (e.t) {
    case "run_started":
      return { ...s, goal: e.goal };
    case "model_called":
      return { ...s, step: e.step, tokens: s.tokens + e.tokens };
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
        // Anything a read tool returned is untrusted content by default. (Ch.9)
        tainted: s.tainted || UNTRUSTED_SOURCES.has(toolOf(e.key)),
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

const EMPTY: State = {
  goal: null, step: 0, tokens: 0, applied: new Map(), transcript: [],
  retained: [], compactedThrough: 0, tainted: false, approvals: new Map(), awaiting: null,
  recentSignatures: [], pending: null, lastError: null, stopped: null,
};

const rebuild = (events: Event[]): State => events.reduce(reduce, EMPTY);

// ─────────────────────────────────────────────────────────────────────────────
// Stopping conditions.  Four of them, none optional. (Ch.2)
// ─────────────────────────────────────────────────────────────────────────────

function budgetStop(s: State, b: Budgets): StopReason | null {
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
async function verifyDone(s: State): Promise<boolean> {
  // SEAM(Ch.8/Ch.10): replace with real verification + a fresh-context evaluator.
  return s.applied.size > 0;
}


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
function humanApproves(s: State): boolean {
  const v = process.env.APPROVE;
  if (!v) return false;
  if (v === "all") return true;
  const cap = Number(v);
  if (!Number.isFinite(cap)) return false;
  return readLog().filter((e) => e.t === "approval_granted").length < cap;
}

/** Ch.9: the worst thing one call can do. The unit approval gates are sized in. */
type BlastRadius = "read" | "write" | "external";

const BLAST: Record<string, BlastRadius> = {
  read_file: "read",
  flaky_check: "read",
  write_note: "write",
  post_webhook: "external",
};

/** Tools whose output is attacker-influenceable. Reading one taints the run. */
const UNTRUSTED_SOURCES = new Set(["read_file"]);

const toolOf = (key: string): string => key.split(":")[1] ?? "";

type Decision =
  | { verdict: "allow" }
  | { verdict: "deny"; reason: string }
  | { verdict: "approve"; reason: string };

/**
 * The whole policy, deterministic and readable in one screen — which is the
 * point. If you cannot read your authorization rules in one sitting, you do not
 * know what your agent is allowed to do.
 */
function authorize(call: { tool: string; args: string; key: string }, s: State): Decision {
  if (process.env.POLICY_OFF) return { verdict: "allow" };

  const radius = BLAST[call.tool];
  if (!radius) return { verdict: "deny", reason: `unknown tool '${call.tool}' — deny by default` };

  // THE TRIFECTA CHECK (Ch.9, Willison). Private data + untrusted content +
  // external communication. We cannot remove the first two, so we cut the third:
  // once untrusted content is in context, egress is closed. Deterministically,
  // without consulting the model that read the untrusted content.
  if (radius === "external" && s.tainted) {
    return {
      verdict: "deny",
      reason: "egress blocked: untrusted content is in context (lethal trifecta)",
    };
  }

  // Blast-radius gate: anything that leaves the process needs a human.
  if (radius === "external") {
    return { verdict: "approve", reason: "external communication requires approval" };
  }

  return { verdict: "allow" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tools.  Name, description, typed args in a real harness. (Ch.5)
// ─────────────────────────────────────────────────────────────────────────────

const tools: Tool[] = [
  {
    name: "read_file",
    // SEAM(Ch.5): this description is a prompt. Optimise it with evals, not taste.
    description: "Read a UTF-8 text file. Args: the path, relative to the workspace.",
    run: async (args) => `contents of ${args} (stub)`,
  },
  {
    name: "write_note",
    description: "Append a line to NOTES.md, the durable scratchpad. Args: the line.",
    // Side-effecting, so the caller dedupes it by key. (Ch.6)
    run: async (args) => {
      mkdirSync(STATE_DIR, { recursive: true });
      appendFileSync(join(STATE_DIR, "NOTES.md"), args + "\n");
      return `noted: ${args}`;
    },
  },
  {
    name: "post_webhook",
    description: "POST a summary to an external URL. Args: the summary text.",
    run: async (args) => `posted ${args.length} chars externally`,
  },
  {
    name: "flaky_check",
    description: "A check that fails the first time it is called. Args: ignored.",
    run: async () => { throw new Error("transient: upstream not ready"); },
  },
];


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

type Policy = "none" | "compact" | "full";
const POLICY = (process.env.POLICY ?? "full") as Policy;

/** Rough but honest: ~4 chars per token. Replace with the provider's counter. */
const estimate = (s: string): number => Math.ceil(s.length / 4);

const SYSTEM_PROMPT = "You are a coding agent. Work the goal; stop when it is done.";
const WINDOW = 400;                // deliberately tiny, so policy effects are visible
const COMPACT_AT = 0.7;            // compact at 70% occupancy (Ch.4)
const KEEP_TOOL_RESULTS = 2;       // tool clearing horizon, in steps (Ch.4)

/**
 * THE RETENTION CONTRACT (Ch.4).
 *
 * The explicit list of what compaction may never drop. Written down, because a
 * compaction policy without one is just amnesia with extra steps. Everything
 * here survives; everything else is negotiable.
 */
function retentionContract(s: State): string[] {
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
function buildContext(s: State): ContextView {
  const notes = existsSync(join(STATE_DIR, "NOTES.md"))
    ? readFileSync(join(STATE_DIR, "NOTES.md"), "utf8")
    : "";

  let history = s.transcript;
  if (POLICY !== "none") {
    // Only the un-compacted tail is replayed verbatim; the rest is `retained`.
    history = history.slice(s.compactedThrough);
  }
  if (POLICY === "full") {
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
    { label: "notes", text: POLICY === "full" ? notes : "" },
    { label: "history", text: history.join("\n") },
  ].map((b) => ({ ...b, tokens: estimate(b.text) }));

  const total = blocks.reduce((n, b) => n + b.tokens, 0);
  return { blocks, total, occupancy: total / WINDOW };
}

/** Which step a transcript line belongs to; used only for tool clearing. */
function lineStep(line: string, history: string[]): number {
  const i = history.indexOf(line);
  for (let j = i; j >= 0; j--) {
    const m = history[j]?.match(/^step (\d+):/);
    if (m) return Number(m[1]);
  }
  return 0;
}

/** Compact if over threshold, honouring the contract. Logged, so it is auditable. */
function maybeCompact(s: State): State {
  if (POLICY === "none") return s;
  const view = buildContext(s);
  if (view.occupancy < COMPACT_AT) return s;

  const contract = retentionContract(s);
  const dropped = estimate(s.transcript.slice(s.compactedThrough).join("\n"));
  append({ t: "context_compacted", step: s.step, droppedTokens: dropped, keptContract: contract });
  console.log(`  ⇊ compacted: dropped ~${dropped} tokens, kept ${contract.length} contract items`);
  return rebuild(readLog());
}

/** Per-run context report. This is the measurement Ch.4's exercise asks for. */
function report(s: State): void {
  const v = buildContext(s);
  const compactions = readLog().filter((e) => e.t === "context_compacted").length;
  console.log(`\ncontext report (POLICY=${POLICY})`);
  for (const b of v.blocks) {
    if (b.tokens) console.log(`  ${b.label.padEnd(9)} ${String(b.tokens).padStart(5)} tok`);
  }
  console.log(`  ${"TOTAL".padEnd(9)} ${String(v.total).padStart(5)} tok  (${(v.occupancy * 100).toFixed(0)}% of ${WINDOW})`);
  console.log(`  compactions: ${compactions}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// The model.  A deterministic stub, so this file runs offline. SEAM(Ch.11/Ch.12)
// ─────────────────────────────────────────────────────────────────────────────

const script: ModelDecision[] = [
  { kind: "call_tool", tool: "read_file", args: "README.md" },
  { kind: "call_tool", tool: "flaky_check", args: "" },
  { kind: "call_tool", tool: "write_note", args: "read the README; flaky_check failed once" },
  { kind: "call_tool", tool: "write_note", args: "plan: summarise, then stop" },
  { kind: "done", summary: "read the file and recorded two notes" },
];

/** SCRIPT=thrash repeats one call forever; SCRIPT=long never finishes. Both exist
 *  so the budget and no-progress stopping conditions can be exercised. (Ch.2) */
const scripts: Record<string, (step: number) => ModelDecision> = {
  default: (step) => script[Math.min(step, script.length - 1)]!,
  thrash: () => ({ kind: "call_tool", tool: "read_file", args: "same.md" }),
  long: (step) => ({ kind: "call_tool", tool: "read_file", args: `file-${step}.md` }),
  // Reads untrusted content, then tries to send it somewhere. The trifecta. (Ch.9)
  exfil: (step) =>
    step === 0
      ? { kind: "call_tool", tool: "read_file", args: "attacker-controlled.md" }
      : { kind: "call_tool", tool: "post_webhook", args: "here is everything I read" },
  // Wants egress but never reads untrusted content — should reach the gate.
  egress: (step) =>
    step < 2
      ? { kind: "call_tool", tool: "write_note", args: `note ${step}` }
      : { kind: "call_tool", tool: "post_webhook", args: "clean summary" },
};

const stubModel: ModelProvider = {
  decide: async (s) => ({
    decision: (scripts[process.env.SCRIPT ?? "default"] ?? scripts.default!)(s.step),
    // A real provider bills the built context, not the raw transcript. (Ch.4/Ch.7)
    tokens: buildContext(s).total,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// The loop.  Fifteen lines of substance; every failure mode lives in them. (Ch.2)
// ─────────────────────────────────────────────────────────────────────────────

async function run(model: ModelProvider, budgets: Budgets, goal: string): Promise<State> {
  let state = rebuild(readLog());

  if (state.goal === null) {
    append({ t: "run_started", goal, at: new Date().toISOString() });
    state = rebuild(readLog());
    console.log(`▶ starting: ${goal}`);
  } else {
    console.log(`▶ resuming at step ${state.step} (${readLog().length} events replayed)`);
  }
  if (state.stopped) { console.log(`already stopped: ${state.stopped}`); return state; }

  while (true) {
    const stop = budgetStop(state, budgets);
    if (stop) return finish(stop);

    if (state.awaiting) {
      // The approval may arrive days later, in a different process. Granting it
      // is just another event; the run then continues from the log. (Ch.6)
      if (humanApproves(state)) {
        append({ t: "approval_granted", step: state.step, key: state.awaiting.key, by: `APPROVE=${process.env.APPROVE}`, uses: 1 });
        console.log(`  ✅ approval granted for ${state.awaiting.tool}`);
        const call = state.awaiting;
        state = rebuild(readLog());
        state = await applyCall(state, { ...call, step: state.step });
        continue;
      }
      console.log(`■ parked: awaiting approval for ${state.awaiting.tool} (resume with APPROVE=all)`);
      report(state);
      return state;
    }

    state = maybeCompact(state);   // SEAM(Ch.4), worked

    // Recover an interrupted call before asking for a new one. Without this,
    // a crash between intent and effect silently loses the work. (Ch.6)
    if (state.pending) {
      console.log(`  ⟳ completing interrupted ${state.pending.tool} from step ${state.pending.step}`);
      state = await applyCall(state, state.pending);
      continue;
    }

    const { decision, tokens } = await model.decide(state, tools);
    append({ t: "model_called", step: state.step + 1, tokens });
    state = rebuild(readLog());

    if (decision.kind === "done") {
      append({ t: "claimed_done", step: state.step, summary: decision.summary });
      state = rebuild(readLog());
      if (await verifyDone(state)) return finish("goal_satisfied");
      console.log("  ✗ done claim rejected — continuing");
      continue;
    }

    // Idempotency key: same step + same call = same effect, applied once. (Ch.6)
    const key = `${state.step}:${decision.tool}:${decision.args}`;
    append({ t: "tool_requested", step: state.step, tool: decision.tool, args: decision.args, key });
    state = rebuild(readLog());

    // Crash on demand, to prove recovery works. Try: CRASH_AT=3 node harness.ts
    if (process.env.CRASH_AT && Number(process.env.CRASH_AT) === state.step) {
      console.log(`  💥 simulated crash at step ${state.step}`);
      process.exit(1);
    }

    state = await applyCall(state, { step: state.step, tool: decision.tool, args: decision.args, key });
  }

  /** Execute one tool call exactly once, logging the outcome either way. (Ch.6) */
  async function applyCall(
    s: State,
    call: { step: number; tool: string; args: string; key: string },
  ): Promise<State> {
    if (s.applied.has(call.key)) {
      console.log(`  ↺ ${call.tool} already applied; skipping`);
      return s;
    }

    // SEAM(Ch.9), worked: authorize BEFORE the effect, deterministically.
    const approvalKey = `${call.tool}:${call.args}`;   // logical, not occurrence
    const d = authorize(call, s);
    if (d.verdict === "deny") {
      append({ t: "tool_denied", step: call.step, tool: call.tool, reason: d.reason });
      console.log(`  ⛔ ${call.tool} -> DENIED: ${d.reason}`);
      return rebuild(readLog());
    }
    if (d.verdict === "approve" && (s.approvals.get(approvalKey) ?? 0) < 1) {
      if (!humanApproves(s)) {
        // A durable wait (Ch.6), not a blocking prompt. The process may exit here
        // and the approval may arrive days later.
        append({ t: "approval_required", step: call.step, tool: call.tool, args: call.args, key: approvalKey });
        console.log(`  ⏸ ${call.tool} needs approval: ${d.reason}`);
        return rebuild(readLog());
      }
      append({ t: "approval_granted", step: call.step, key: approvalKey, by: `APPROVE=${process.env.APPROVE}`, uses: 1 });
      console.log(`  ✅ approved: ${call.tool}`);
      s = rebuild(readLog());
    }
    if (d.verdict === "approve") {
      append({ t: "approval_consumed", step: call.step, key: approvalKey });
      s = rebuild(readLog());
    }

    const tool = tools.find((t) => t.name === call.tool);
    try {
      if (!tool) throw new Error(`no such tool: ${call.tool}`);
      const result = await tool.run(call.args);
      append({ t: "tool_succeeded", step: call.step, key: call.key, result });
      console.log(`  ✓ ${call.tool} -> ${result}`);
    } catch (err) {
      // Error compaction: one line, never the raw dump. (Ch.2, 12-factor #9)
      const msg = String(err instanceof Error ? err.message : err).slice(0, 200);
      append({ t: "tool_failed", step: call.step, key: call.key, error: msg });
      console.log(`  ✗ ${call.tool} -> ${msg}`);
    }
    return rebuild(readLog());
  }

  function finish(reason: StopReason): State {
    append({ t: "run_stopped", reason, at: new Date().toISOString() });
    console.log(`■ stopped: ${reason} (${state.step} steps, ${state.tokens} tokens)`);
    report(state);
    return rebuild(readLog());
  }
}

const budgets: Budgets = { maxSteps: 20, maxTokens: 200_000, noProgressWindow: 3 };
await run(stubModel, budgets, "read the README and leave notes");
