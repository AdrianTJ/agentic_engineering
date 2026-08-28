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
  /** What the model sees. In a real harness this is a context policy. SEAM(Ch.4) */
  transcript: string[];
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
    case "claimed_done":
      return { ...s, transcript: [...s.transcript, `claimed done: ${e.summary}`] };
    case "run_stopped":
      return { ...s, stopped: e.reason };
  }
}

const EMPTY: State = {
  goal: null, step: 0, tokens: 0, applied: new Map(), transcript: [],
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
    name: "flaky_check",
    description: "A check that fails the first time it is called. Args: ignored.",
    run: async () => { throw new Error("transient: upstream not ready"); },
  },
];

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
};

const stubModel: ModelProvider = {
  decide: async (s) => ({
    decision: (scripts[process.env.SCRIPT ?? "default"] ?? scripts.default!)(s.step),
    tokens: 120 + s.transcript.length * 20,
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
    return rebuild(readLog());
  }
}

const budgets: Budgets = { maxSteps: 12, maxTokens: 20_000, noProgressWindow: 3 };
await run(stubModel, budgets, "read the README and leave notes");
