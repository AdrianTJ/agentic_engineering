// ─────────────────────────────────────────────────────────────────────────────
// Cache accounting.  A worked SEAM(Ch.7), and the one that makes the curriculum's
// central tension measurable.
//
// Ch.4 says compact. Ch.7 says compaction rewrites the prefix and rewriting
// invalidates the cache. Until now the harness could measure the first and not
// the second, so the tension was an argument rather than a number.
//
// Providers cache an exact PREFIX. A block is cached only if it and every block
// before it are byte-identical to the previous turn. One edit early in the
// context invalidates everything after it — which is why block ORDER is a cost
// decision, not a style one.
// ─────────────────────────────────────────────────────────────────────────────

import { createHash } from "node:crypto";

export const hash = (s: string): string => createHash("sha1").update(s).digest("hex").slice(0, 12);

/**
 * TWO CACHE MODELS, because the choice changes the answer. (Ch.7)
 *
 *   CACHE_MODEL=block  (default) — a block is cached only if it and every block
 *                      before it are byte-identical. Any edit anywhere in a block
 *                      re-bills the whole block. Coarse.
 *
 *   CACHE_MODEL=chunk  — the cached prefix is measured in 40-character chunks, so
 *                      an append-only block stays cached up to the point it grew,
 *                      and a mid-list deletion invalidates only from that point
 *                      on. This is much closer to how providers actually cache.
 *
 * Chunk granularity is still not token granularity — chunks are a fixed-width
 * approximation and a real tokenizer would place boundaries differently. It is
 * finer than block and coarser than the truth, which is the honest claim.
 */
export const CACHE_MODEL = (process.env.CACHE_MODEL ?? "block") as "block" | "chunk";

const CHUNK = 40;
const chunks = (s: string): string[] => {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += CHUNK) out.push(hash(s.slice(i, i + CHUNK)));
  return out;
};

/** Providers discount cached input rather than making it free. ~0.1x is typical. */
export const CACHE_READ_RATE = 0.1;

/**
 * Split this turn's blocks into the cached prefix and the fresh remainder, by
 * comparing against the previous turn's fingerprints.
 */
export function cacheSplit(
  blocks: { label: string; text: string; tokens: number }[],
  prev: { label: string; hash: string; tokens: number }[],
  prevChunks: string[] = [],
): {
  cached: number;
  fresh: number;
  fingerprints: { label: string; hash: string; tokens: number }[];
  chunks: string[];
} {
  const fingerprints = blocks.map((b) => ({ label: b.label, hash: hash(b.text), tokens: b.tokens }));

  if (CACHE_MODEL === "chunk") {
    // Prefix measured over the concatenated context, in fixed-width chunks.
    const text = blocks.map((b) => b.text).join("\n");
    const now = chunks(text);
    const before = prevChunks;
    let n = 0;
    while (n < now.length && n < before.length && now[n] === before[n]) n++;
    const total = blocks.reduce((a, b) => a + b.tokens, 0);
    const cachedFrac = now.length ? n / now.length : 0;
    const cachedTok = Math.round(total * cachedFrac);
    return { cached: cachedTok, fresh: total - cachedTok, fingerprints, chunks: now };
  }

  let cached = 0;
  let i = 0;
  // The prefix ends at the first block that differs — everything after is fresh,
  // even if it happens to be unchanged.
  for (; i < fingerprints.length; i++) {
    const a = fingerprints[i]!;
    const b = prev[i];
    if (!b || b.label !== a.label || b.hash !== a.hash) break;
    cached += a.tokens;
  }
  const fresh = fingerprints.slice(i).reduce((n, b) => n + b.tokens, 0);
  return { cached, fresh, fingerprints, chunks: chunks(blocks.map((b) => b.text).join("\n")) };
}

/** Billed tokens for one turn, with cached input discounted. */
export const billed = (cached: number, fresh: number): number => Math.round(cached * CACHE_READ_RATE + fresh);

