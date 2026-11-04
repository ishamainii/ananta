// wheel.js — the chakravala method, pure and testable (node chambers/chakravala/wheel.test.mjs).
const isqrt = N => Math.floor(Math.sqrt(N));
const babs = x => x < 0n ? -x : x;
export function chakravala(N) {
  const r = isqrt(N); if (r * r === N) throw new Error("N must not be a perfect square");
  let a = BigInt(N - r * r < (r + 1) ** 2 - N ? r : r + 1), b = 1n, k = a * a - BigInt(N);
  const NB = BigInt(N), steps = [{ a, b, k, m: null }];
  while (k !== 1n) {
    const K = babs(k);
    let m0 = 1n; while ((a + b * m0) % K !== 0n) m0++;                  // k must divide a + b·m
    let best = null;                                                     // among m ≡ m0 (mod |k|), m² closest to N
    for (let m = m0; m <= BigInt(2 * r + 2) + K; m += K) if (best === null || babs(m * m - NB) < babs(best * best - NB)) best = m;
    const m = best;
    [a, b, k] = [(a * m + NB * b) / K, (a + b * m) / K, (m * m - NB) / k];
    steps.push({ a, b, k, m });
    if (steps.length > 400) throw new Error("too many turns");
  }
  return steps;
}

