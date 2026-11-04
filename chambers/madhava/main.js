// chamber 02 · mādhava — the series for π/4 and the Kerala end-corrections.
//
// chain view: the k-th term is a link of length 1/(2k+1) that turns by `twist` from the
//   previous one, so the chain's end is  f(z) = Σ z^k/(2k+1)  with z = e^{i·twist}.
//   At twist = 180° (z = −1) that is 1 − 1/3 + 1/5 − … = π/4, Mādhava's series.
// swing view: rays at angle π + magnification·(estimate − π) on a circle. Plain partial
//   sums swing wide; with Mādhava's correction the ray lands on π.
import { createFlatStage, glowLine, glowDot } from "../../js/flat-stage.js";
import { createSound, degree, SA } from "../../js/sound.js";
import { setupChamber } from "../../js/chamber-ui.js";

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const HEX = ["#ffcf6b", "#ff8a3d", "#ff5c8a", "#b08cff", "#5fd4ff", "#5fe3b2"];
const stage = createFlatStage({ gain: 0.8 });
const { ctx } = stage;
const sound = createSound();

// ---------- the math (mirrors python/ananta/madhava.py) ----------
const partial = n => { let s = 0; for (let k = 0; k < n; k++) s += (k % 2 ? -1 : 1) / (2 * k + 1); return s; };
const CORR = [n => 0, n => 1 / (4 * n), n => n / (4 * n * n + 1), n => (n * n + 1) / (n * (4 * n * n + 5))];
const estimate = (n, order) => 4 * (partial(n) + (n % 2 ? -1 : 1) * CORR[order](n));
const goodDigits = x => { const a = x.toFixed(12), b = Math.PI.toFixed(12); let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };

// ---------- state ----------
let view = "chain", terms = 1, maxTerms = 60, twist = Math.PI, autoTwist = !reduce, order = 3, lastTermAt = 0, playing = !reduce;
const TERM_MS = 420;

// ---------- dock ----------
$("viewSel").addEventListener("change", e => { view = e.target.value; });
$("orderSel").addEventListener("change", e => { order = +e.target.value; });

function readout() {
  const rows = [0, 1, 2, 3].map(o => {
    const v = estimate(terms, o), d = goodDigits(v), s = v.toFixed(12);
    const label = ["plain series     ", "+ 1/(4n)         ", "+ n/(4n²+1)      ", "+ (n²+1)/(n(4n²+5))"][o];
    return `${label} <b>${s.slice(0, d)}</b>${s.slice(d)}  <span class="${o === order ? "ok" : ""}">${Math.max(0, d - 2)} digits</span>`;
  });
  $("ro").innerHTML = `n = <b>${terms}</b> terms<br>${rows.join("<br>")}`;
  const best = estimate(terms, order), d = goodDigits(best), s = best.toFixed(10);
  $("cap2").innerHTML = `<span class="hot">${s.slice(0, d)}</span><span>${s.slice(d)}</span>`;
  $("cap1").textContent = view === "chain"
    ? `twist ${(twist * 180 / Math.PI).toFixed(0)}° · ${Math.abs(twist - Math.PI) < 0.01 ? "the chain folds onto Mādhava's series: its end is π/4" : "the same series, sent around the circle as e^{iθ}"}`
    : `magnified ×${fmtMag(mag)} · rose: plain partial sums · gold: with Mādhava's correction`;
}
const fmtMag = m => m >= 1e4 ? m.toExponential(1).replace("e+", "×10^") : Math.round(m).toLocaleString();
let mag = 1;

// ---------- drawing ----------
function drawChain(t) {
  const W = stage.W, H = stage.H, pts = [[0, 0]];
  let x = 0, y = 0;
  for (let k = 0; k < terms; k++) { const L = 1 / (2 * k + 1), a = k * twist; x += L * Math.cos(a); y += L * Math.sin(a); pts.push([x, y]); }
  let minx = 0, maxx = 0, miny = 0, maxy = 0; for (const [px, py] of pts) { minx = Math.min(minx, px); maxx = Math.max(maxx, px); miny = Math.min(miny, py); maxy = Math.max(maxy, py); }
  const span = Math.max(maxx - minx, (maxy - miny) * W / H, 0.6), sc = Math.min(W, H * W / H) * 0.62 / span;
  const cx = W / 2 - (minx + maxx) / 2 * sc, cy = H / 2 + (miny + maxy) / 2 * sc - 20;
  const S = ([px, py]) => [cx + px * sc, cy - py * sc];
  // links, coloured along the chain; each joint gets a petal sized by its term
  for (let k = 0; k < terms; k++) {
    const a = S(pts[k]), b = S(pts[k + 1]), c = HEX[k % HEX.length], fresh = k === terms - 1 ? Math.min(1, (performance.now() - lastTermAt) / 300) : 1;
    glowLine(ctx, [a, [a[0] + (b[0] - a[0]) * fresh, a[1] + (b[1] - a[1]) * fresh]], c, 1.8, 0.9);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = c; ctx.globalAlpha = 0.18;
    ctx.beginPath(); ctx.arc(b[0], b[1], sc / (2 * k + 1) * 0.5, 0, 6.2832); ctx.stroke(); ctx.restore();
  }
  const end = S(pts[terms]); glowDot(ctx, end[0], end[1], 4, "#fff0d6");
  if (Math.abs(twist - Math.PI) < 0.02) {        // mark π/4 and the corrected endpoint
    const tgt = S([Math.PI / 4, 0]), cor = S([estimate(terms, order) / 4, 0]);
    ctx.save(); ctx.strokeStyle = "rgba(255,210,122,.5)"; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(tgt[0], tgt[1] - 60); ctx.lineTo(tgt[0], tgt[1] + 60); ctx.stroke(); ctx.restore();
    ctx.fillStyle = "#ffd27a"; ctx.font = "12px 'IBM Plex Mono', monospace"; ctx.fillText("π/4", tgt[0] + 6, tgt[1] - 48);
    glowDot(ctx, cor[0], cor[1], 5, "#ffd27a");
  }
}
function drawSwing() {
  const W = stage.W, H = stage.H, R = Math.min(W, H) * 0.36, cx = W / 2 + R * 0.55, cy = H / 2 - 10;
  const err = Math.abs(estimate(terms, 0) - Math.PI);
  mag += (((Math.PI / 3) / Math.max(err, 1e-15)) - mag) * 0.08;           // plain sums fill about ±60°
  ctx.save(); ctx.strokeStyle = "rgba(255,210,122,.22)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke(); ctx.restore();
  const ray = (v, color, alpha, w) => { const a = Math.PI + Math.max(-1.4, Math.min(1.4, (v - Math.PI) * mag)); glowLine(ctx, [[cx, cy], [cx + R * Math.cos(a), cy - R * Math.sin(a)]], color, w, alpha); };
  for (let k = Math.max(1, terms - 14); k <= terms; k++) {                   // recent history fades
    const age = (terms - k) / 15;
    ray(estimate(k, 0), "#ff5c8a", 0.85 * (1 - age), 1.2);
    ray(estimate(k, order), "#ffd27a", 0.95 * (1 - age), 2);
  }
  glowDot(ctx, cx - R, cy, 5, "#fff0d6");
  ctx.fillStyle = "#efe6d6"; ctx.font = "12px 'IBM Plex Mono', monospace"; ctx.fillText("π", cx - R - 22, cy + 4);
}

// ---------- loop ----------
const t0 = performance.now();
function frame(now) {
  const t = (now - t0) / 1000;
  if (playing && now - lastTermAt > TERM_MS) {
    lastTermAt = now; terms = terms >= maxTerms ? 1 : terms + 1;
    const d = goodDigits(estimate(terms, order));
    // plus terms play the base note, minus terms three steps higher in the raag (Sa→Pa is × 3/2), so every note stays in Bhupali
    sound.why = `term ${terms}: ${terms % 2 ? "+" : "−"}1/${2 * terms - 1}${terms % 2 ? "" : ", a minus term, so three notes higher in the raag"}`;
    sound.pluck(degree(Math.min(9, 2 + Math.floor(terms / 8)) + (terms % 2 ? 0 : 3), SA * 2), 0.05);
    if (terms > 1 && d > goodDigits(estimate(terms - 1, order))) { sound.why = `π gained a correct digit: ${Math.max(0, d - 2)} now`; sound.bowl(SA * 4); }
    readout();
  }
  if (autoTwist && view === "chain") {          // breathe away from 180° and come back, so the spiral blooms and folds
    const phase = (t % 24) / 24, open = Math.sin(Math.PI * Math.min(1, phase / 0.7)) ** 2;
    twist = Math.PI - open * 1.9;
  }
  stage.psyche.setFold(view === "chain" ? 6 + (terms % 10) : 12);
  stage.render(reduce ? 0 : t, sound.energy());
  stage.clear();
  view === "chain" ? drawChain(t) : drawSwing();
  if (Math.floor(t * 4) % 2 === 0) readout();
  requestAnimationFrame(frame);
}

setupChamber({ key: "madhava", sound, psyche: stage.psyche, tools: [
  { name: "set_terms", hint: "show 25 terms", description: "Show the first n terms of Madhava's series (1 to 200) and pause there.",
    input_schema: { type: "object", properties: { n: { type: "integer", minimum: 1, maximum: 200 } }, required: ["n"] },
    parse: t => { const m = t.match(/(\d+)\s*terms?/); return m ? { n: +m[1] } : null; },
    run: ({ n }) => { terms = Math.max(1, Math.min(200, n)); maxTerms = Math.max(maxTerms, terms); playing = false; readout();
      return { say: `${terms} terms: plain ${estimate(terms, 0).toFixed(8)}, corrected ${estimate(terms, 3).toFixed(12)}.`, plain: estimate(terms, 0), corrected: estimate(terms, 3) }; } },
  { name: "play", hint: "play", description: "Resume adding terms one by one.", input_schema: { type: "object", properties: {} },
    parse: t => /\b(play|resume|continue|go)\b/.test(t) ? {} : null, run: () => { playing = true; return { say: "Adding terms again." }; } },
  { name: "set_view", hint: "swing view", description: "Switch between 'chain' (the twisting series) and 'swing' (precision of the corrections).",
    input_schema: { type: "object", properties: { view: { type: "string", enum: ["chain", "swing"] } }, required: ["view"] },
    parse: t => /swing|precision|zoom|magnif/.test(t) ? { view: "swing" } : /chain|spiral|twist/.test(t) && !/\d/.test(t) ? { view: "chain" } : null,
    run: ({ view: v }) => { view = v; $("viewSel").value = v; return { say: v === "swing" ? "Swing view: plain sums swing wide, corrected sums land on π." : "Chain view." }; } },
  { name: "set_twist", hint: "twist 120 degrees", description: "Fix the twist angle between links, in degrees. 180 gives Madhava's series for π/4.",
    input_schema: { type: "object", properties: { degrees: { type: "number" } }, required: ["degrees"] },
    parse: t => { const m = t.match(/twist\D*(\d+)/); return m ? { degrees: +m[1] } : null; },
    run: ({ degrees }) => { autoTwist = false; view = "chain"; $("viewSel").value = "chain"; twist = degrees * Math.PI / 180; return { say: `Twist fixed at ${degrees}°.` }; } },
  { name: "set_correction", hint: "correction 1", description: "Choose Madhava's end-correction: 0 none, 1 = 1/(4n), 2 = n/(4n²+1), 3 = (n²+1)/(n(4n²+5)).",
    input_schema: { type: "object", properties: { order: { type: "integer", minimum: 0, maximum: 3 } }, required: ["order"] },
    parse: t => { const m = t.match(/correction\D*(\d)/); return m ? { order: +m[1] } : null; },
    run: ({ order: o }) => { order = o; $("orderSel").value = String(o); readout(); return { say: `Correction ${o}: ${estimate(terms, o).toFixed(12)} with ${terms} terms.` }; } },
] });
readout();
requestAnimationFrame(frame);
