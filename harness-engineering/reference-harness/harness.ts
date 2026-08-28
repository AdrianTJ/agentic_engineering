/**
 * The reference harness for the harness-engineering curriculum — the loop.
 *
 * Run it:      node harness.ts
 * Crash it:    CRASH_AT=3 node harness.ts     (then run again — it resumes)
 * Contain it:  ./run-sandboxed.sh SCRIPT=escape
 * Reset it:    rm -rf .state
 * Measure it:  ./measure.sh   → MEASUREMENTS.md
 *
 * Requires Node 22.6+ (runs TypeScript directly). No dependencies, no network,
 * no API key: the model is a deterministic stub, so the loop is inspectable and
 * the whole thing runs offline in about a second.
 *
 * This file is the LOOP and nothing else. Each concern lives in its own module,
 * one per chapter, so a chapter can point at a file rather than a line range:
 *
 *   src/types.ts     the contracts — see SPEC.md
 *   src/log.ts       Ch.6  append-only event log, the reducer, crash recovery
 *   src/stopping.ts  Ch.2  the four stopping conditions
 *   src/router.ts    Ch.3  static edges, taken before the model is consulted
 *   src/context.ts   Ch.4  what the model sees: retention contract, compaction
 *   src/tools.ts     Ch.5  tool definitions — descriptions are prompts
 *   src/cache.ts     Ch.7  cache accounting; billed cost, not raw
 *   src/policy.ts    Ch.9  deterministic authorization outside the model
 *   src/model.ts     Ch.11/12  the one function you swap for a real SDK call
 *
 * Ch.5, Ch.8 and Ch.10 remain unimplemented, marked `SEAM(Ch.N)`. The gaps are
 * the curriculum.
 */

import type { State, StopReason, Budgets, ModelDecision, ModelProvider } from "./src/types.ts";
import { append, readLog, rebuild } from "./src/log.ts";
import { budgetStop, verifyDone } from "./src/stopping.ts";
import { authorize, humanApproves } from "./src/policy.ts";
import { tools } from "./src/tools.ts";
import { buildContext, maybeCompact, report } from "./src/context.ts";
import { cacheSplit } from "./src/cache.ts";
import { route } from "./src/router.ts";
import { stubModel } from "./src/model.ts";

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

    // SEAM(Ch.3), worked: a static edge, taken before the model is consulted.
    const routed = route(state);
    let decision: ModelDecision;
    if (routed) {
      append({ t: "routed_statically", step: state.step + 1, tool: "read_file", rule: routed.rule });
      state = rebuild(readLog());
      decision = routed.decision;
    } else {
      const view = buildContext(state);
      const { cached, fresh, fingerprints, chunks } = cacheSplit(view.blocks, state.lastBlocks, state.lastChunks);
      const r = await model.decide(state, tools);
      append({
        t: "model_called", step: state.step + 1, tokens: r.tokens,
        blocks: fingerprints, cached, fresh, chunks,
      });
      state = rebuild(readLog());
      decision = r.decision;
    }

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

