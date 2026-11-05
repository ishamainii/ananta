// chamber 06 · tātkālika — Bhāskara II's instantaneous motion and the extremum of the equation of centre.
//
// A planet's mean position moves uniformly; its true position = mean + E(M), where the
// equation of centre for an epicycle of radius r on a deferent of radius R is
//     E(M) = −arcsin((r/R)·sin M).
// The true daily motion is the mean motion times (1 + dE/dM). dE/dM ∝ −cos M vanishes
// at M = 90°, 270°, exactly where E is extreme: the instant the correction to the
// velocity is zero, true speed = mean speed. (Ramasubramanian & Srinivas 2010, §6.)
// The right panel turns that into optimisation: a bead climbs E(M) by following the
// instantaneous rate, and stops where the rate vanishes.
import { createFlatStage, glowLine, glowDot } from "../../js/flat-stage.js";
import { createSound, degree, SA } from "../../js/sound.js";
import { setupChamber } from "../../js/chamber-ui.js";

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const stage = createFlatStage({ gain: 0.85 });
const { ctx } = stage;
const sound = createSound();

let k = 0.32;                 // r/R, epicycle over deferent
let M = 0.3, mean = 0, frameSpin = 0.93, bead = 0.4, beadV = 0, trail = [], lastNote = 0, wasExtreme = false;
const E = M => -Math.asin(k * Math.sin(M));
const dE = M => -k * Math.cos(M) / Math.sqrt(1 - (k * Math.sin(M)) ** 2);
const deg = r => (r * 180 / Math.PI);

function readout() {
  const rate = 1 + dE(M);
  $("ro").innerHTML = `r/R = <b>${k.toFixed(2)}</b> · anomaly M = <b>${(deg(M) % 360).toFixed(1)}°</b>` +
    `<br>equation of centre E = <b>${deg(E(M)).toFixed(2)}°</b>` +
    `<br>true speed / mean speed = <b>${rate.toFixed(4)}</b>` +
    `<br><span class="${Math.abs(dE(M)) < 0.02 ? "ok" : ""}">instantaneous correction dE/dM = ${dE(M).toFixed(4)}</span>`;
}

function draw(t) {
  const W = stage.W, H = stage.H, wide = W > 820;
  // ---- left: the epicycle, seen from a slowly turning frame so the orbit draws a rosette
  const R = Math.min(wide ? W * 0.24 : W * 0.36, H * 0.3), cx = wide ? W * 0.32 : W / 2, cy = wide ? H / 2 - 10 : H * 0.36;
  const ang = mean - frameSpin * mean, mx = cx + R * Math.cos(ang), my = cy - R * Math.sin(ang);
  // the epicycle's radius is drawn in proportion to the planet's distance H from earth (H/R below).
  // With that construction the angle earth sees between mean and true planet is exactly
  // E(M) = −arcsin(k sin M), the sine rule the curve on the right plots, so the picture and the
  // formula are the same model. (A fixed-size epicycle would give atan2(−k sin M, 1 − k cos M)
  // instead, whose extreme sits at cos M = k, not at 90°.)
  const Hn = (-k * Math.cos(M) + Math.sqrt(1 - (k * Math.sin(M)) ** 2)) / (1 - k * k);
  const pa = ang + M + Math.PI, px = mx + R * k * Hn * Math.cos(pa), py = my - R * k * Hn * Math.sin(pa);
  ctx.save(); ctx.strokeStyle = "rgba(255,210,122,.2)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
  ctx.beginPath(); ctx.arc(mx, my, R * k * Hn, 0, 6.2832); ctx.stroke(); ctx.restore();
  trail.push([px, py]); if (trail.length > 2600) trail.shift();
  const seg = 120; for (let i = 0; i + 1 < trail.length; i += seg) {
    const hue = ["#ffcf6b", "#ff8a3d", "#ff5c8a", "#b08cff", "#5fd4ff"][Math.floor(i / seg) % 5];
    glowLine(ctx, trail.slice(i, i + seg + 1), hue, 1.1, 0.25 + 0.75 * i / trail.length);
  }
  glowLine(ctx, [[cx, cy], [mx, my]], "rgba(255,210,122,.6)", 0.8, 0.6);
  glowLine(ctx, [[mx, my], [px, py]], "#ff8a3d", 1.2, 0.8);
  glowLine(ctx, [[cx, cy], [px, py]], "#fff0d6", 1, 0.7);
  glowDot(ctx, cx, cy, 4, "#5fd4ff"); glowDot(ctx, mx, my, 3, "#ffd27a", 0.6); glowDot(ctx, px, py, 5, "#fff0d6");
  ctx.font = "11px 'IBM Plex Mono', monospace";                     // name the three bodies
  ctx.fillStyle = "#5fd4ff"; ctx.fillText("earth", cx + 8, cy + 16);
  ctx.fillStyle = "#ffd27a"; ctx.fillText("mean planet", mx + 8, my - 8);
  ctx.fillStyle = "#fff0d6"; ctx.fillText("true planet", px + 9, py + 4);

  // ---- right: E(M) over one revolution, its tangent now, and the bead climbing to the extremum
  const gx = wide ? W * 0.58 : 24, gw = wide ? W * 0.36 : W - 48, gy = wide ? H / 2 - 10 : H * 0.72, gh = Math.min(H * 0.16, 120);
  const X = m => gx + (m / (2 * Math.PI)) * gw, Y = e => gy - e / Math.asin(Math.min(0.99, k)) * gh;
  ctx.save(); ctx.strokeStyle = "rgba(239,230,214,.18)"; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke(); ctx.restore();
  const curve = []; for (let i = 0; i <= 200; i++) { const m = i / 200 * 2 * Math.PI; curve.push([X(m), Y(E(m))]); }
  glowLine(ctx, curve, "#b08cff", 1.4, 0.9);
  const m0 = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), slope = dE(m0), L = 60;
  const sx = gw / (2 * Math.PI), sy = gh / Math.asin(Math.min(0.99, k)), dirx = 1, diry = -slope * sy / sx, nrm = Math.hypot(dirx, diry);
  const flat = Math.abs(slope) < 0.02;
  glowLine(ctx, [[X(m0) - L * dirx / nrm, Y(E(m0)) - L * diry / nrm], [X(m0) + L * dirx / nrm, Y(E(m0)) + L * diry / nrm]], flat ? "#5fe3b2" : "#ffcf6b", 1.6, 1);
  glowDot(ctx, X(m0), Y(E(m0)), 4, flat ? "#5fe3b2" : "#ffcf6b");
  glowDot(ctx, X(bead), Y(E(bead)), 5, "#5fe3b2", 0.95);
  ctx.fillStyle = "rgba(239,230,214,.6)"; ctx.font = "11px 'IBM Plex Mono', monospace";
  ctx.fillText("E(M), equation of centre", gx, gy - gh - 14);
  ctx.fillText("0°", gx - 4, gy + 16); ctx.fillText("90°", X(Math.PI / 2) - 10, gy + 16); ctx.fillText("180°", X(Math.PI) - 14, gy + 16); ctx.fillText("270°", X(1.5 * Math.PI) - 14, gy + 16);
  ctx.fillText("green bead: gradient ascent on E using only the instantaneous rate", gx, gy + gh + 30);
  return flat;
}

const t0 = performance.now();
let last = t0;
function frame(now) {
  const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!reduce) { mean += dt * 0.55; M += dt * 0.55 * 0.83; }       // anomaly runs a little slower than the mean (the apsis drifts)
  // gradient ascent: move the bead along +dE/dM with a little momentum; restart when it settles
  beadV = 0.86 * beadV + 0.06 * dE(bead); bead += beadV;
  if (Math.abs(dE(bead)) < 1e-3 && Math.abs(beadV) < 1e-4) { if (Math.random() < 0.01) { bead = Math.random() * 2 * Math.PI; beadV = 0; } }
  bead = ((bead % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  stage.psyche.setFold(8 + 2 * Math.round(4 * k));
  stage.render(reduce ? 0 : t, sound.energy());
  stage.clear(); const flat = draw(t);
  if (flat && !wasExtreme) { sound.why = "dE/dM = 0: the correction is at its extreme, true speed = mean speed"; sound.bowl(); }
  wasExtreme = flat;
  if (now - lastNote > 700) { lastNote = now; sound.why = `true speed = ${(1 + dE(M)).toFixed(2)} × mean speed → pitch = 4 × that`; sound.pluck(degree(Math.round(4 + 4 * (1 + dE(M)) - 4), SA * 2), 0.05); readout(); }
  $("cap1").textContent = flat ? "the instantaneous correction vanishes · E is at its extreme · true speed equals mean speed"
    : "the planet's true place = mean place + equation of centre";
  $("cap2").innerHTML = `<span class="${flat ? "hot" : ""}" style="font-family:'IBM Plex Mono',monospace;font-size:clamp(16px,2.4vw,26px);letter-spacing:.02em">dE/dM = ${dE(M).toFixed(3)}</span>`;
  requestAnimationFrame(frame);
}

$("kSel").addEventListener("input", e => { k = e.target.value / 100; trail = []; });
setupChamber({ key: "optimisation", sound, psyche: stage.psyche, tools: [
  { name: "set_epicycle", hint: "epicycle 0.5", description: "Set the epicycle-to-deferent ratio r/R (0.05 to 0.8). Bigger ratios give bigger equations of centre and wilder rosettes.",
    input_schema: { type: "object", properties: { ratio: { type: "number", minimum: 0.05, maximum: 0.8 } }, required: ["ratio"] },
    parse: t => { const m = t.match(/(?:epicycle|ratio)\D*(0?\.\d+|\d+(?:\.\d+)?)/); return m ? { ratio: +m[1] > 1 ? +m[1] / 100 : +m[1] } : null; },
    run: ({ ratio }) => { k = Math.max(0.05, Math.min(0.8, ratio)); $("kSel").value = Math.round(k * 100); trail = [];
      return { say: `r/R = ${k.toFixed(2)}: the largest equation of centre is ${deg(Math.asin(k)).toFixed(1)}°, reached at anomaly 90°.` }; } },
  { name: "goto_anomaly", hint: "go to 90 degrees", description: "Jump the planet to a given anomaly M in degrees and report the instantaneous correction there.",
    input_schema: { type: "object", properties: { degrees: { type: "number" } }, required: ["degrees"] },
    parse: t => { const m = t.match(/(\d+)\s*(?:°|deg)/); return m ? { degrees: +m[1] } : null; },
    run: ({ degrees }) => { M = degrees * Math.PI / 180; readout(); return { say: `At M = ${degrees}°, dE/dM = ${dE(M).toFixed(4)} and E = ${deg(E(M)).toFixed(2)}°.` }; } },
] });
readout();
requestAnimationFrame(frame);
