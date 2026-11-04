// yantra.js — the Śrī Yantra as 11 equations in 16 unknowns (mirrors python/ananta/sriyantra.py).
// Pure functions, tested by yantra.test.mjs.
//
// Triangle i: horizontal side at height b[i], half-width w[i], apex on the axis at a[i].
// Outer triangles D1, U1: apex on the circle, base corners on the circle (w = √(1 − b²)).
// Every other apex sits on another triangle's base line (APEX_ON_BASE).
// TRIPLES: eleven points where three lines must meet. 16 unknowns − 11 equations = 5 free choices.

export const NAMES = ["D1", "U1", "U2", "U3", "U4", "D2", "D3", "D4", "D5"];
const APEX_ON_BASE = { U3: "D1", U2: "D3", D3: "U4", D2: "U3", U4: "D2", D4: "U2", D5: "U1" };
const APEX_ON_CIRCLE = { D1: -1, U1: 1 };
export const TRIPLES = [
  ["D1.R", "U1.base", "U2.R"], ["D1.R", "U2.base", "U3.R"], ["D1.base", "D2.R", "U1.R"],
  ["D1.base", "D3.R", "U2.R"], ["D2.R", "U1.base", "U3.R"], ["D2.R", "U4.R", "U4.base"],
  ["D2.base", "D3.R", "U1.R"], ["D3.R", "D4.base", "U4.R"], ["D3.R", "D5.base", "U3.R"],
  ["D4.R", "D4.base", "U2.R"], ["D5.R", "D5.base", "U4.R"],
];
const FREE_W = NAMES.filter(n => !(n in APEX_ON_CIRCLE));
export const FIXED = ["D1", "U1", "U3", "U4", "D3"].map(n => NAMES.indexOf(n));   // the 5 free choices

// reference solution (texample.net/sri-yantra), converted to unit circle, y up
const REF = { D1: [53.65669559977147, 123.20508075688774, 246.34330440022853], U1: [52.984011026495736, 174.24660560764943, 247.01598897350425],
  U3: [98.71823312733801, 220.03828947357886, 201.281766872662], U2: [78.26467997914015, 197.92315674002487, 221.73532002085986],
  D3: [90.4856922951427, 78.10499177949904, 209.51430770485734], D2: [80.98384838952128, 103.12199145016105, 219.0161516104787],
  U4: [114.9488500600036, 160.66014976539617, 185.0511499399964], D4: [116.35142605010424, 134.30757626706648, 183.64857394989576],
  D5: [124.61190803072795, 144.79777263138968, 175.38809196927207] };
export const reference = () => [...NAMES.map(n => -(REF[n][1] - 150) / 100), ...FREE_W.map(n => (REF[n][2] - REF[n][0]) / 200)];

export function unpack(x) {
  const b = {}, w = {}, a = {};
  NAMES.forEach((n, i) => { b[n] = x[i]; });
  for (const n in APEX_ON_CIRCLE) w[n] = Math.sqrt(Math.max(1e-12, 1 - b[n] ** 2));
  FREE_W.forEach((n, i) => { w[n] = x[9 + i]; });
  for (const n of NAMES) a[n] = n in APEX_ON_CIRCLE ? APEX_ON_CIRCLE[n] : b[APEX_ON_BASE[n]];
  return { b, w, a };
}
export function line(name, g) {
  const [tri, part] = name.split(".");
  let A, B, C;
  if (part === "base") { A = 0; B = 1; C = -g.b[tri]; }
  else { const x1 = g.w[tri], y1 = g.b[tri], x2 = 0, y2 = g.a[tri]; A = y2 - y1; B = x1 - x2; C = -(A * x1 + B * y1); }
  const s = Math.hypot(A, B); return [A / s, B / s, C / s];
}
const det3 = ([a, b, c], [d, e, f], [g, h, i]) => a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
export function residuals(x) { const g = unpack(x); return TRIPLES.map(t => det3(...t.map(n => line(n, g)))); }
export const norm = r => Math.hypot(...r);
export function meet(l1, l2) { const [a, b, c] = l1, [d, e, f] = l2, z = a * e - b * d; return [(b * f - c * e) / z, (c * d - a * f) / z]; }

function solveLinear(A, y) {                       // Gaussian elimination with partial pivoting
  const n = y.length, M = A.map((r, i) => [...r, y[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}
// one damped Newton step on the 11 non-fixed unknowns; returns the new x
export function newtonStep(x, fixed = FIXED) {
  const free = x.map((_, i) => i).filter(i => !fixed.includes(i)), r0 = residuals(x), h = 1e-7;
  const J = r0.map(() => new Array(free.length).fill(0));
  free.forEach((j, c) => { const xp = x.slice(); xp[j] += h; const r = residuals(xp); r.forEach((v, i) => { J[i][c] = (v - r0[i]) / h; }); });
  const dx = solveLinear(J, r0.map(v => -v));
  let lam = 1, best = x;
  for (let tries = 0; tries < 8; tries++, lam /= 2) {      // backtrack if the step makes things worse
    const xn = x.slice(); free.forEach((j, c) => { xn[j] += lam * dx[c]; });
    if (xn.every(Number.isFinite) && norm(residuals(xn)) < norm(r0)) { best = xn; break; }
  }
  return best;
}
