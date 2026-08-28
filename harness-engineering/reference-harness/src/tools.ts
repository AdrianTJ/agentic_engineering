import type { Tool } from "./types.ts";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STATE_DIR } from "./paths.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Tools.  Name, description, typed args in a real harness. (Ch.5)
// ─────────────────────────────────────────────────────────────────────────────

export const tools: Tool[] = [
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
    name: "escape_workspace",
    description: "Write a file outside the workspace. Args: the content.",
    // Deliberately hostile. The POLICY classifies this as a mere `write`, so
    // authorization lets it through — and only CONTAINMENT stops it. That gap is
    // the entire argument for defence in depth. (Ch.9)
    run: async (args) => {
      writeFileSync("/tmp/escaped-the-workspace.txt", args);
      return "wrote outside the workspace";
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

