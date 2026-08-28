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

/** Providers discount cached input rather than making it free. ~0.1x is typical. */
export const CACHE_READ_RATE = 0.1;

/**
 * Split this turn's blocks into the cached prefix and the fresh remainder, by
 * comparing against the previous turn's fingerprints.
 */
export function cacheSplit(
  blocks: { label: string; text: string; tokens: number }[],
  prev: { label: string; hash: string; tokens: number }[],
): { cached: number; fresh: number; fingerprints: { label: string; hash: string; tokens: number }[] } {
  const fingerprints = blocks.map((b) => ({ label: b.label, hash: hash(b.text), tokens: b.tokens }));
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
  return { cached, fresh, fingerprints };
}

/** Billed tokens for one turn, with cached input discounted. */
export const billed = (cached: number, fresh: number): number => Math.round(cached * CACHE_READ_RATE + fresh);

