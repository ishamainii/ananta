// chamber 03 · chakravāla — the cyclic method for x² − N·y² = 1 (Jayadeva, Bhāskara II).
// Exact integer arithmetic with BigInt; mirrors python/ananta/chakravala.py.
import { createFlatStage, glowLine, glowDot } from "../../js/flat-stage.js";
import { createSound, degree, SA } from "../../js/sound.js";
import { setupChamber } from "../../js/chamber-ui.js";

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const HEX = ["#ffcf6b", "#ff8a3d", "#ff5c8a", "#b08cff", "#5fd4ff", "#5fe3b2"];
const stage = createFlatStage({ gain: 0.85 });
const { ctx } = stage;
const sound = createSound();

import { chakravala } from "./wheel.js";

// ---------- state ----------
let N = 61, steps = chakravala(61), shown = 1, lastStepAt = 0, playing = true, doneAt = 0, spin = 0;
const STEP_MS = 1500, FAMOUS = [61, 67, 94, 97, 109, 151, 181, 433, 661, 991];
function setN(n) {
  N = n; steps = chakravala(n); shown = 1; lastStepAt = performance.now(); doneAt = 0; playing = true;
  $("nSel").value = FAMOUS.includes(n) ? String(n) : "";
  stage.psyche.setFold(Math.max(6, Math.min(20, steps.length)));
  readout();
}
$("nSel").addEventListener("change", e => { if (e.target.value) setN(+e.target.value); });

const digits = x => x.toString().length;
const group = x => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function readout() {
  const s = steps[shown - 1], last = shown === steps.length;
  $("cap1").innerHTML = last
    ? `the wheel closes after <i style="color:#ffd27a">${steps.length - 1}</i> turns, k = 1`
    : `turn ${shown - 1}: a² − ${N}·b² = <i style="color:#ff5c8a">${s.k}</i>`;
  $("cap2").innerHTML = `<span class="${last ? "hot" : ""}" style="letter-spacing:.02em;font-family:'IBM Plex Mono',monospace;font-size:clamp(14px,2.3vw,24px)">${group(s.a)}² − ${N}·${group(s.b)}² = ${s.k}</span>`;
  const rows = steps.slice(Math.max(0, shown - 9), shown).map((t, i, arr) =>
    `${t.m === null ? "start " : "m=" + String(t.m).padEnd(4)} a=<b>${group(t.a)}</b> b=${group(t.b)} k=${t.k}`);
  const ratio = Number(s.a) / Number(s.b);
  $("ro").innerHTML = `x² − <b>${N}</b>y² = 1<br>${rows.join("<br>")}<br>a/b = ${ratio.toFixed(12)}<br>√${N} = ${Math.sqrt(N).toFixed(12)}`;
}

// ---------- drawing: a spiral wheel, one spoke per turn ----------
function draw(t) {
  const W = stage.W, H = stage.H, cx = W / 2, cy = H / 2 - 20, R = Math.min(W, H) * 0.36;
  const total = steps.length, maxD = digits(steps[total - 1].a);
  const pos = i => {                                     // angle: position in the cycle; radius: number of digits of a
    const ang = spin + i / total * Math.PI * 2 - Math.PI / 2, rr = R * (0.18 + 0.82 * digits(steps[i].a) / maxD);
    return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
  };
  // faint full wheel
  ctx.save(); ctx.strokeStyle = "rgba(255,210,122,.16)"; ctx.lineWidth = 1;
  for (const rr of [R * 0.18, R * 0.59, R]) { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke(); }
  for (let i = 0; i < total; i++) { const p = pos(i); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.globalAlpha = 0.25; ctx.stroke(); }
  ctx.restore();
  // the path walked so far
  const pts = []; for (let i = 0; i < shown; i++) pts.push(pos(i));
  const fresh = Math.min(1, (performance.now() - lastStepAt) / 700);
  if (pts.length > 1) { const a = pts[pts.length - 2], b = pts[pts.length - 1]; pts[pts.length - 1] = [a[0] + (b[0] - a[0]) * fresh, a[1] + (b[1] - a[1]) * fresh]; }
  glowLine(ctx, pts, "#ffd27a", 2, 0.95);
  for (let i = 0; i < shown; i++) {
    const p = pos(i), k = Number(steps[i].k), c = k === 1 ? "#fff0d6" : HEX[Math.abs(k) % HEX.length];
    const petal = 4 + 3 * Math.sqrt(Math.abs(k));         // petal size shows |k|: the wheel closes when it shrinks to 1
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = c; ctx.globalAlpha = 0.6;
    for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4 + t * 0.3; ctx.beginPath(); ctx.ellipse(p[0] + Math.cos(a) * petal, p[1] + Math.sin(a) * petal, petal, petal * 0.38, a, 0, 6.2832); ctx.stroke(); }
    ctx.restore();
    glowDot(ctx, p[0], p[1], k === 1 ? 6 : 3, c);
    ctx.fillStyle = c; ctx.globalAlpha = i === shown - 1 ? 1 : 0.6; ctx.font = "11px 'IBM Plex Mono', monospace";   // each stop says its k
    ctx.fillText(i === 0 ? `start k=${k}` : `k=${k}`, p[0] + 9, p[1] - 9); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(239,230,214,.45)"; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";   // the rings measure digits of a
  ctx.fillText("further out = more digits in a", cx, cy + R + 22); ctx.textAlign = "start";
  if (doneAt) {                                         // the closing bloom
    const e = Math.min(1, (performance.now() - doneAt) / 2500);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let r = 0; r < 5; r++) { ctx.strokeStyle = HEX[r]; ctx.globalAlpha = (1 - e) * 0.6; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R * (0.2 + e * (1 + r * 0.2)), 0, 6.2832); ctx.stroke(); }
    ctx.restore();
  }
}

const t0 = performance.now();
function frame(now) {
  const t = (now - t0) / 1000;
  if (!reduce) spin += 0.0015;
  if (playing && now - lastStepAt > STEP_MS) {
    if (shown < steps.length) {
      shown++; lastStepAt = now; readout();
      const k = Number(steps[shown - 1].k);
      sound.why = `turn ${shown}: k = ${k}, so the pitch sits ${Math.round(Math.log2(Math.abs(k) + 1))} steps up (≈ log₂|k|)`;
      sound.pluck(degree(Math.min(9, Math.round(Math.log2(Math.abs(k) + 1)) + 2), SA * 2), 0.07);
      if (k === 1) { doneAt = now; sound.why = `k = 1: x² − ${N}y² = 1 is solved`; sound.bowl(); sound.bowl(SA * 3); }
    } else if (doneAt && now - doneAt > 9000) {        // move on to the next famous N
      setN(FAMOUS[(FAMOUS.indexOf(N) + 1) % FAMOUS.length]);
    }
  }
  stage.render(reduce ? 0 : t, sound.energy());
  stage.clear(); draw(t);
  requestAnimationFrame(frame);
}

setupChamber({ key: "chakravala", sound, psyche: stage.psyche, tools: [
  { name: "solve_pell", hint: "solve N = 991", description: "Run the chakravala wheel on x² − N·y² = 1 for a non-square N (2 to 5000) and show every turn.",
    input_schema: { type: "object", properties: { N: { type: "integer", minimum: 2, maximum: 5000 } }, required: ["N"] },
    parse: t => { const m = t.match(/(?:n\s*=?\s*|solve\D*|pell\D*)(\d{1,4})/); return m ? { N: +m[1] } : null; },
    run: ({ N: n }) => {
      try { setN(n); } catch (e) { return { say: `${n} is a perfect square, so x² − ${n}y² = 1 has only the trivial solution.`, error: "perfect square" }; }
      const s = steps[steps.length - 1];
      return { say: `For N = ${n} the wheel closes in ${steps.length - 1} turns: x has ${digits(s.a)} digits.`, x: s.a.toString(), y: s.b.toString(), turns: steps.length - 1 };
    } },
] });
setN(61);
requestAnimationFrame(frame);
