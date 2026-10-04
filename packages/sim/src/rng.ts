// packages/sim/src/rng.ts

export type RNG = () => number;

/**
 * Mulberry32: Fast, high-quality 32-bit integer PRNG.
 * Bit-exact across Node.js, V8, and modern JavaScript engines.
 */
export function mulberry32(seed: number): RNG {
  let a = (seed >>> 0) || 1;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

/**
 * Returns a uniform integer in [lo, hi] inclusive.
 */
export function randInt(rng: RNG, lo: number, hi: number): number {
  if (lo >= hi) return lo;
  const range = (hi - lo + 1) >>> 0;
  const raw = rng();
  return lo + (raw % range);
}

/**
 * Returns true with probability = permille / 1000.
 */
export function randChance(rng: RNG, permille: number): boolean {
  if (permille <= 0) return false;
  if (permille >= 1000) return true;
  const raw = rng() % 1000;
  return raw < permille;
}

/**
 * Deterministic hash combining seed and salt into a 32-bit unsigned integer.
 */
export function hash32(seed: number, salt: number): number {
  let h = ((seed >>> 0) ^ Math.imul(salt >>> 0, 0x5bd1e995)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0xe6546b64) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}
