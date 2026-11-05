// chamber 04 · ramanujan — partitions and their generating function.
//
// The shader paints P(q) = Π_{k≥1} 1/(1 − q^k) over the unit disk (domain colouring):
// hue = arg P, bright bands = contours of log|P|. P has a "natural boundary": it blows up
// toward every root of unity e^{2πi a/b}. Hardy & Ramanujan's circle method reads p(n) off
// exactly these blow-ups, biggest first (q → 1), then a/b = 1/2, 1/3, …
// The readout counts p(n) exactly (Euler's pentagonal recurrence, BigInt) and compares it
// with their leading term  p(n) ~ e^{π√(2n/3)} / (4n√3).
import { createFlatStage } from "../../js/flat-stage.js";
import { createSound, degree, SA } from "../../js/sound.js";
import { setupChamber } from "../../js/chamber-ui.js";
import * as THREE from "three";

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const frag = /* glsl */ `
precision highp float;
uniform float uTime, uGlow, uPulse, uZoom, uTerms, uSpin;
uniform vec2 uRes, uCenter;
vec2 cmul(vec2 a, vec2 b) { return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }
vec3 pal(float t) { return vec3(0.52, 0.36, 0.46) + vec3(0.48, 0.42, 0.44) * cos(6.28318 * (t + vec3(0.02, 0.24, 0.56))); }
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / (0.43 * min(uRes.x, uRes.y));
  vec2 q = uCenter + p / uZoom;
  float c = cos(uSpin), s = sin(uSpin); q = vec2(c*q.x - s*q.y, s*q.x + c*q.y);
  float r = length(q);
  if (r >= 0.9995) {                                   // outside: the boundary glows faintly
    float rim = exp(-60.0 * (r - 1.0)); gl_FragColor = vec4(vec3(1.0, 0.75, 0.4) * rim * 0.35, 1.0); return;
  }
  float logmag = 0.0, arg = 0.0; vec2 qk = q;
  for (int k = 1; k <= 400; k++) {                     // log P = −Σ log(1 − q^k)
    if (float(k) > uTerms || dot(qk, qk) < 1e-14) break;
    vec2 w = vec2(1.0, 0.0) - qk;
    logmag -= 0.5 * log(dot(w, w)); arg -= atan(w.y, w.x);
    qk = cmul(qk, q);
  }
  float hue = arg / 6.28318 + uTime * 0.015;
  float band = fract(logmag * 0.45 - uTime * 0.12);          // contours of |P| drift inward like breath
  float phase = abs(fract(arg / 6.28318 * 3.0) - 0.5);       // iso-phase lines
  vec3 col = pal(hue);
  col *= 0.42 + 0.58 * smoothstep(0.0, 0.18, band) * smoothstep(1.0, 0.82, band);
  col += vec3(1.0, 0.85, 0.6) * smoothstep(0.03, 0.0, phase) * 0.35;
  col *= mix(0.55, 1.1, uGlow) * (1.0 + 0.6 * uPulse) * smoothstep(1.0, 0.94, r);
  gl_FragColor = vec4(col, 1.0);
}`;
const uniforms = { uZoom: { value: 1 }, uTerms: { value: 160 }, uCenter: { value: new THREE.Vector2(0, 0) }, uSpin: { value: 0 } };
const stage = createFlatStage({ frag, uniforms, gain: 0.35 });
const sound = createSound();

// ---------- exact partitions: Euler's pentagonal number theorem ----------
const P = [1n];
function p(n) {
  for (let m = P.length; m <= n; m++) {
    let s = 0n;
    for (let j = 1; ; j++) {
      const g1 = j * (3 * j - 1) / 2, g2 = j * (3 * j + 1) / 2, sign = j % 2 ? 1n : -1n;
      if (g1 > m) break;
      s += sign * P[m - g1]; if (g2 <= m) s += sign * P[m - g2];
    }
    P.push(s);
  }
  return P[n];
}
const hr = n => Math.exp(Math.PI * Math.sqrt(2 * n / 3)) / (4 * n * Math.sqrt(3));
const group = x => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// ---------- views ----------
let n = 1, lastAt = 0, playing = true;
let target = { cx: 0, cy: 0, zoom: 1, spin: 0, name: "disk" };
const view = { cx: 0, cy: 0, zoom: 1 };
function dive(a, b) {                                   // zoom toward e^{2πi a/b} on the boundary
  const th = 2 * Math.PI * a / b, r = 0.93;
  target = { cx: r * Math.cos(th), cy: r * Math.sin(th), zoom: 5.5, name: `${a}/${b}` };
}
function whole() { target = { cx: 0, cy: 0, zoom: 1, name: "disk" }; }

function readout() {
  const v = p(n), est = hr(n), mod5 = n % 5 === 4;
  $("ro").innerHTML = `p(<b>${n}</b>) = <b>${group(v)}</b>` +
    `<br>Hardy–Ramanujan leading term ≈ ${est < 1e15 ? group(Math.round(est)) : est.toExponential(4)}` +
    `<br>ratio exact / estimate = <b>${(Number(v) / est).toFixed(5)}</b>` +
    (mod5 ? `<br><span class="ok">n = 5k + 4, so 5 divides p(n): ${group(v)} = 5 × ${group(v / 5n)}</span>` : `<br>&nbsp;`);
  $("cap1").innerHTML = target.name === "disk"
    ? `P(q) = ∏ 1/(1 − qᵏ) over the unit disk`
    : `diving toward the root of unity e^{2πi·${target.name}}, one of the circle method's major arcs`;
  $("cap2").innerHTML = `<span style="font-family:'IBM Plex Mono',monospace;letter-spacing:.02em;font-size:clamp(16px,2.6vw,28px)" class="${mod5 ? "hot" : ""}">p(${n}) = ${group(p(n))}</span>`;
}

const t0 = performance.now();
let tour = 0;
const TOUR = [() => whole(), () => dive(0, 1), () => dive(1, 2), () => dive(1, 3), () => dive(1, 5), () => dive(2, 5), () => whole()];
let tourAt = 0;
function frame(now) {
  const t = (now - t0) / 1000;
  if (playing && now - lastAt > 900) {
    n = n >= 200 ? 1 : n + 1; lastAt = now; readout();
    sound.why = `n = ${n}: n mod 5 = ${n % 5} picks the note${n % 10 >= 5 ? ", second half of each ten an octave up" : ""}`;
    sound.pluck(degree((n % 5) + 2 + (n % 10 >= 5 ? 5 : 0), SA * 2), 0.05);
    if (n % 5 === 4) { sound.why = `n = ${n} = 5k + 4, so 5 divides p(${n})`; sound.bowl(SA * 2); }
  }
  if (!reduce && now - tourAt > 11000) { tourAt = now; TOUR[tour++ % TOUR.length](); readout(); }
  for (const k of ["cx", "cy", "zoom"]) view[k] += ((k === "cx" || k === "cy" ? target[k] : target.zoom) - view[k]) * 0.012;
  uniforms.uCenter.value.set(view.cx, view.cy);
  uniforms.uZoom.value = view.zoom;
  uniforms.uTerms.value = Math.min(400, 120 + view.zoom * 50);
  uniforms.uSpin.value = reduce ? 0 : Math.sin(t * 0.05) * 0.15;
  stage.psyche.setFold(target.name === "disk" ? 10 : 2 * (+target.name.split("/")[1] || 5));
  stage.render(reduce ? 0 : t, sound.energy());
  stage.clear();
  requestAnimationFrame(frame);
}

$("viewSel").addEventListener("change", e => { const v = e.target.value; tourAt = performance.now() + 60000; v === "disk" ? whole() : dive(...v.split("/").map(Number)); readout(); });

setupChamber({ key: "ramanujan", sound, psyche: stage.psyche, tools: [
  { name: "partitions", hint: "partitions of 100", description: "Show p(n), the number of ways to write n as a sum of positive integers (n up to 2000), with the Hardy–Ramanujan estimate.",
    input_schema: { type: "object", properties: { n: { type: "integer", minimum: 1, maximum: 2000 } }, required: ["n"] },
    parse: t => { const m = t.match(/(?:partitions? of|p\()\s*(\d+)/); return m ? { n: +m[1] } : null; },
    run: ({ n: m }) => { n = Math.max(1, Math.min(2000, m)); playing = false; readout();
      return { say: `p(${n}) = ${group(p(n))}. The Hardy–Ramanujan leading term is off by a factor of ${(Number(p(n)) / hr(n)).toFixed(4)}.`, p: p(n).toString() }; } },
  { name: "dive", hint: "dive toward 1/5", description: "Zoom the domain colouring toward the root of unity e^{2πi a/b} on the boundary circle (a major arc of the circle method). Use a=0,b=1 for q→1.",
    input_schema: { type: "object", properties: { a: { type: "integer" }, b: { type: "integer", minimum: 1, maximum: 12 } }, required: ["a", "b"] },
    parse: t => { const m = t.match(/(\d+)\s*\/\s*(\d+)/); return m ? { a: +m[1], b: +m[2] } : /whole|disk|zoom out/.test(t) ? { a: -1, b: 1 } : null; },
    run: ({ a, b }) => { tourAt = performance.now() + 60000; if (a < 0) { whole(); readout(); return { say: "The whole disk." }; } dive(a, b); readout(); return { say: `Diving toward e^{2πi·${a}/${b}}, where P(q) blows up.` }; } },
  { name: "play", hint: "play", description: "Resume counting partitions.", input_schema: { type: "object", properties: {} },
    parse: t => /\b(play|resume|continue)\b/.test(t) ? {} : null, run: () => { playing = true; return { say: "Counting again." }; } },
] });
readout();
requestAnimationFrame(frame);
