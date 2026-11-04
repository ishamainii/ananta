// chamber 05 · śrī yantra — the yantra as a constrained optimisation, solved live.
// The cycle: hold a perfect yantra → scramble it → Newton's method pulls all eleven
// triple points back into exact concurrency, one visible step at a time.
import { createFlatStage, glowLine, glowDot } from "../../js/flat-stage.js";
import { createSound, degree, SA } from "../../js/sound.js";
import { setupChamber } from "../../js/chamber-ui.js";
import { NAMES, TRIPLES, FIXED, reference, unpack, line, residuals, norm, meet, newtonStep } from "./yantra.js";

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const stage = createFlatStage({ gain: 0.7 });
const { ctx } = stage;
const sound = createSound();
const SHIVA = "#ffcf6b", SHAKTI = "#ff5c8a", OK = "#5fe3b2";

let x = reference(), shown = x.slice(), phase = "hold", phaseAt = performance.now(), iter = 0, hist = [], cycle = 0;
const HOLD_MS = 7000, STEP_MS = 650;

function scramble(amount = 0.045) {
  x = x.map((v, i) => FIXED.includes(i) ? v : v + amount * (Math.random() * 2 - 1));
  phase = "solve"; phaseAt = performance.now(); iter = 0; hist = [norm(residuals(x))]; readout();
}
function nudge() {                                   // move one of the five free choices: a new member of the family
  const i = FIXED[Math.floor(Math.random() * FIXED.length)], ref = reference();
  x[i] = ref[i] + (Math.random() * 2 - 1) * 0.025;
  phase = "solve"; phaseAt = performance.now(); iter = 0; hist = [norm(residuals(x))]; readout();
  return NAMES[i];
}
function readout() {
  const r = residuals(x), ok = r.filter(v => Math.abs(v) < 1e-9).length, R = norm(r);
  $("ro").innerHTML = `unknowns <b>16</b> · equations <b>11</b> · free choices <b>5</b>` +
    `<br>Newton iteration <b>${iter}</b> · ‖residual‖ = <b>${R.toExponential(2)}</b>` +
    `<br><span class="${ok === 11 ? "ok" : ""}">${ok} / 11 triple points exact</span>`;
  $("cap1").textContent = phase === "hold" ? "every marked point is three lines meeting exactly · rose = Śakti (down), gold = Śiva (up)"
    : "Newton's method pulling the triangles back into exact concurrency";
  $("cap2").innerHTML = ok === 11 ? `<span class="hot">९ त्रिकोण · 11 / 11</span>` : `<span>${ok} / 11</span>`;
}

// ---------- drawing ----------
function draw(t) {
  const W = stage.W, H = stage.H, R = Math.min(W, H) * 0.33, cx = W / 2, cy = H / 2 - 18;
  const S = (px, py) => [cx + px * R, cy - py * R];
  // decor: bhupura with four gates, circles, two lotus rings slowly counter-rotating
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(255,210,122,.22)"; ctx.lineWidth = 1;
  for (const rr of [1.0, 1.06, 1.42, 1.5]) { ctx.beginPath(); ctx.arc(cx, cy, R * rr, 0, 6.2832); ctx.stroke(); }
  const petals = (n, r1, r2, rot, col) => { ctx.strokeStyle = col; for (let k = 0; k < n; k++) { const a = rot + k * 6.2832 / n, da = 3.1416 / n;
      ctx.beginPath(); ctx.moveTo(cx + r1 * Math.cos(a - da), cy + r1 * Math.sin(a - da));
      ctx.quadraticCurveTo(cx + r2 * 1.12 * Math.cos(a), cy + r2 * 1.12 * Math.sin(a), cx + r1 * Math.cos(a + da), cy + r1 * Math.sin(a + da)); ctx.stroke(); } };
  petals(8, R * 1.06, R * 1.3, reduce ? 0 : t * 0.03, "rgba(255,154,74,.35)");
  petals(16, R * 1.3, R * 1.48, reduce ? 0 : -t * 0.02, "rgba(176,140,255,.35)");
  // one side of the square (with its gate), then the same side turned by −90°, three more times
  const s = R * 1.72, g = R * 0.3, h = R * 0.16, side = [[-s, s], [-g, s], [-g, s + h], [g, s + h], [g, s], [s, s]], bh = [];
  for (let q = 0; q < 4; q++) { const c = Math.cos(-q * Math.PI / 2), sn = Math.sin(-q * Math.PI / 2); side.forEach(([px, py]) => bh.push([cx + c * px - sn * py, cy + sn * px + c * py])); }
  bh.push(bh[0]); ctx.strokeStyle = "rgba(255,210,122,.3)"; ctx.beginPath(); bh.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
  ctx.restore();

  // the nine triangles
  const gm = unpack(shown);
  for (const n of NAMES) {
    const up = n[0] === "U", w = gm.w[n], b = gm.b[n], a = gm.a[n];
    glowLine(ctx, [S(-w, b), S(w, b), S(0, a), S(-w, b)], up ? SHIVA : SHAKTI, 1.6, 0.95);
  }
  // the eleven triple points (and their mirror images)
  const r = residuals(shown);
  TRIPLES.forEach((tr, i) => {
    const [px, py] = meet(line(tr[0], gm), line(tr[1], gm)), err = Math.abs(r[i]);
    if (!Number.isFinite(px)) return;
    const exact = err < 1e-9, size = exact ? 3.2 : 3 + Math.min(18, err * 900) * (1 + 0.3 * Math.sin(t * 6 + i));
    for (const sx of [1, -1]) { const [X, Y] = S(sx * px, py); glowDot(ctx, X, Y, size, exact ? OK : SHAKTI, exact ? 0.9 : 0.75); }
  });
  const bindu = S(0, (gm.b.D5 * 2 + gm.a.D5) / 3); glowDot(ctx, bindu[0], bindu[1], 3.5, "#fff0d6");

  // residual history (log scale), bottom left
  if (hist.length > 1) {
    const x0 = 24, y0 = H - 150, w = 180, hgt = 60;
    const pts = hist.map((v, i) => [x0 + i / Math.max(1, hist.length - 1) * w, y0 - (Math.log10(Math.max(v, 1e-16)) + 16) / 16 * hgt]);
    glowLine(ctx, pts, OK, 1.2, 0.9);
    ctx.fillStyle = "rgba(239,230,214,.55)"; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText("log₁₀ ‖residual‖ per Newton step", x0, y0 + 16);
  }
}

const t0 = performance.now();
let lastStep = 0;
function frame(now) {
  const t = (now - t0) / 1000;
  if (phase === "hold" && !reduce && now - phaseAt > HOLD_MS) { cycle++ % 2 ? nudge() : scramble(); }
  if (phase === "solve" && now - lastStep > STEP_MS) {
    lastStep = now; x = newtonStep(x); iter++; const R = norm(residuals(x)); hist.push(R); readout();
    sound.pluck(degree(Math.min(9, Math.max(0, Math.round(-Math.log10(R) / 1.6))), SA * 2), 0.07);
    if (R < 1e-12 || iter > 25) { phase = "hold"; phaseAt = now; sound.bowl(); readout(); }
  }
  for (let i = 0; i < x.length; i++) shown[i] += (x[i] - shown[i]) * 0.12;   // glide between Newton iterates
  stage.psyche.setFold(phase === "hold" ? 16 : 9);
  stage.render(reduce ? 0 : t, sound.energy());
  stage.clear(); draw(t);
  requestAnimationFrame(frame);
}

$("scrambleBtn").addEventListener("click", () => scramble(0.06));
$("nudgeBtn").addEventListener("click", () => nudge());
setupChamber({ key: "sriyantra", sound, psyche: stage.psyche, tools: [
  { name: "scramble", hint: "scramble it", description: "Knock the yantra out of alignment by a given amount (0.01 to 0.1) and let Newton's method solve it again live.",
    input_schema: { type: "object", properties: { amount: { type: "number", minimum: 0.01, maximum: 0.1 } } },
    parse: t => /scramble|break|mess|shake/.test(t) ? { amount: 0.06 } : null,
    run: ({ amount = 0.05 }) => { scramble(amount); return { say: `Scrambled. ${residuals(x).filter(v => Math.abs(v) < 1e-9).length} of 11 points still meet; watch Newton fix the rest.` }; } },
  { name: "new_yantra", hint: "show another yantra", description: "Change one of the five free parameters to show a different, equally exact member of the Śrī Yantra family.",
    input_schema: { type: "object", properties: {} },
    parse: t => /another|new|different|nudge|family/.test(t) ? {} : null,
    run: () => { const n = nudge(); return { say: `Moved the height of ${n}. The other eleven unknowns re-solve to a new exact yantra.` }; } },
  { name: "reset", hint: "reset", description: "Return to the reference yantra.", input_schema: { type: "object", properties: {} },
    parse: t => /reset|original|reference/.test(t) ? {} : null,
    run: () => { x = reference(); phase = "hold"; phaseAt = performance.now(); hist = []; readout(); return { say: "Back to the reference yantra." }; } },
] });
readout();
requestAnimationFrame(frame);
