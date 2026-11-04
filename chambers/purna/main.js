// chamber 07 · pūrṇa — three ideas of the infinite.
//   I   pūrṇa:   a mandala that contains a copy of itself at every scale (a Droste spiral).
//               Zooming in never finds a bottom: take the whole from the whole, the whole remains.
//   II  Jaina:   saṅkhyāta → asaṅkhyāta → ananta. Rings of seeds multiply by ten each ring
//               until they can't be counted, then can't be bounded.
//   III khahara: Bhāskara II's quantity divided by zero; adding or subtracting doesn't change it.
import { createFlatStage, glowLine, glowDot } from "../../js/flat-stage.js";
import { createSound, degree, SA } from "../../js/sound.js";
import { setupChamber } from "../../js/chamber-ui.js";

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Droste mandala. Work in w = log z. A pattern periodic in log|z| (period P) and in the
// angle looks identical at every scale; adding a twist that shifts the angle by 2π per period
// turns stacked rings into one continuous spiral. Sliding log|z| with time is an endless zoom.
const frag = /* glsl */ `
precision highp float;
uniform float uTime, uTrip, uPulse, uMode, uPetals;
uniform vec2 uRes;
vec3 pal(float t) { return vec3(0.55, 0.38, 0.45) + vec3(0.45, 0.4, 0.45) * cos(6.28318 * (t + vec3(0.0, 0.2, 0.55))); }
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float r = length(p) + 1e-4, a = atan(p.y, p.x);
  float P = log(3.2);                                     // scale factor between copies
  float L = log(r) - uTime * 0.11;                        // endless zoom
  float tw = L + a * P / 6.28318;                         // Droste twist: one turn = one scale step
  float ring = floor(tw / P), u = fract(tw / P);
  float petals = abs(cos(a * uPetals * 0.5));            // uPetals is even, so this is seamless where the angle wraps
  float edge = abs(u - (0.25 + 0.55 * petals));
  float line = smoothstep(0.045, 0.0, edge) + 0.5 * smoothstep(0.02, 0.0, abs(u - 0.06));
  float fill = smoothstep(0.0, 0.6, 0.25 + 0.55 * petals - u) * 0.35;
  vec3 col = pal(tw / P + 0.15 * petals + uTime * 0.02) * (line + fill);   // tw/P jumps by exactly 1 at the wrap; pal has period 1
  float calm = mix(1.0, 0.45, step(0.5, uMode));          // dimmer behind the other two movements
  col *= mix(0.45, 1.05, uTrip) * (1.0 + 0.7 * uPulse) * calm * smoothstep(0.0, 0.08, r) * smoothstep(1.4, 0.4, r);
  gl_FragColor = vec4(col, 1.0);
}`;
const uniforms = { uMode: { value: 0 }, uPetals: { value: 8 } };
const stage = createFlatStage({ frag, uniforms, gain: 0.3 });
const { ctx } = stage;
const sound = createSound();

const MOVES = [
  { key: "purna", line: "pūrṇam adaḥ pūrṇam idam · pūrṇāt pūrṇam udacyate · pūrṇasya pūrṇam ādāya · pūrṇam evāvaśiṣyate",
    cap: "That is whole, this is whole. From the whole the whole arises. Taking the whole from the whole, the whole remains. (Bṛhadāraṇyaka 5.1.1)" },
  { key: "jaina", line: "saṅkhyāta → asaṅkhyāta → ananta",
    cap: "Jaina texts sort every number into enumerable, innumerable and infinite." },
  { key: "khahara", line: "a ÷ 0 = khahara",
    cap: "Bhāskara II, Bījagaṇita 2.20: a quantity divided by zero is unchanged by adding or subtracting." },
];
let move = 0, moveAt = performance.now(), lastNote = 0;
function setMove(i) {
  move = ((i % 3) + 3) % 3; moveAt = performance.now(); uniforms.uMode.value = move;
  document.querySelectorAll("#moves button").forEach((b, j) => b.setAttribute("aria-pressed", String(j === move)));
  $("cap2").innerHTML = `<span style="font-size:clamp(15px,2.2vw,24px);letter-spacing:.06em">${MOVES[move].line}</span>`;
  $("cap1").textContent = MOVES[move].cap; sound.why = `movement ${move + 1}: harmonic ${move + 2} of Sa`; sound.bowl(SA * (move + 2));
}
document.querySelectorAll("#moves button").forEach((b, j) => b.addEventListener("click", () => setMove(j)));

// ---------- II: rings of seeds, ×10 per ring ----------
function drawJaina(t, e) {
  const W = stage.W, H = stage.H, cx = W / 2, cy = H / 2 - 30, R0 = Math.min(W, H) * 0.06;
  const labels = ["10", "100", "1,000", "10,000", "10⁵", "10⁶ …"];
  for (let i = 0; i < 6; i++) {
    const appear = Math.min(1, Math.max(0, e * 7 - i)), rr = R0 * (1 + i * 0.95);
    if (appear <= 0) continue;
    const count = 10 ** (i + 1), drawn = Math.min(count, 900), col = ["#ffcf6b", "#ff8a3d", "#ff5c8a", "#b08cff", "#5fd4ff", "#fff0d6"][i];
    if (drawn < count && i >= 4) {                       // too many to draw one by one: a continuous band of light
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = col; ctx.globalAlpha = 0.5 * appear; ctx.lineWidth = 6 + 4 * Math.sin(t * 2 + i);
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832 * appear); ctx.stroke(); ctx.restore();
    } else {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = col; ctx.globalAlpha = 0.85 * appear;
      for (let k = 0; k < drawn * appear; k++) { const a = k / drawn * 6.2832 + t * 0.05 * (i % 2 ? 1 : -1); ctx.fillRect(cx + rr * Math.cos(a) - 1, cy + rr * Math.sin(a) - 1, 2.2, 2.2); }
      ctx.restore();
    }
    ctx.fillStyle = "rgba(239,230,214,.7)"; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(labels[i], cx + rr + 6, cy - 4);
  }
  const stage2 = e < 0.45 ? "saṅkhyāta · enumerable" : e < 0.8 ? "asaṅkhyāta · innumerable" : "ananta · infinite";
  ctx.fillStyle = "#ffd27a"; ctx.font = "14px 'IBM Plex Mono', monospace"; ctx.textAlign = "center"; ctx.fillText(stage2, cx, cy + R0 * 6.6 + 10); ctx.textAlign = "start";
}
// ---------- III: a ÷ x as x → 0, then ± anything ----------
function drawKhahara(t, e) {
  const W = stage.W, H = stage.H, ox = W * 0.5, oy = H * 0.66, sx = Math.min(W * 0.38, 420), sy = H * 0.48, a = 1;
  const xNow = Math.max(0.004, 1 - Math.min(1, e * 1.35));
  const pts = []; for (let x = 1; x >= xNow; x *= 0.985) pts.push([ox + x * sx, oy - Math.min(1.4, a / x / 60) * sy]);
  ctx.save(); ctx.strokeStyle = "rgba(239,230,214,.25)"; ctx.beginPath(); ctx.moveTo(ox - 20, oy); ctx.lineTo(ox + sx + 20, oy); ctx.moveTo(ox, oy + 20); ctx.lineTo(ox, oy - sy * 1.45); ctx.stroke(); ctx.restore();
  glowLine(ctx, pts, "#ff5c8a", 1.8, 1);
  const end = pts[pts.length - 1]; glowDot(ctx, end[0], end[1], 5, "#ffd27a");
  if (e > 0.75) { const beam = Math.min(1, (e - 0.75) * 4); glowLine(ctx, [[ox + 2, oy], [ox + 2, oy - sy * 1.45 * beam]], "#ffd27a", 3, 0.9); }
  ctx.fillStyle = "#efe6d6"; ctx.font = "13px 'IBM Plex Mono', monospace";
  const v = a / xNow, show = e > 0.75 ? "khahara" : v.toFixed(v < 10 ? 2 : 0);
  ctx.fillText(`1 ÷ ${xNow.toFixed(3)} = ${show}`, ox + 16, oy - sy * 1.3);
  if (e > 0.85) { ctx.fillStyle = "#5fe3b2"; ctx.fillText("khahara + 1000 = khahara      khahara − 1000 = khahara", ox - sx * 0.9, oy + 40); }
}

const t0 = performance.now();
let count = 0;
function frame(now) {
  const t = (now - t0) / 1000, e = Math.min(1, Math.max(0, (now - moveAt) / 14000));
  if (!reduce && now - moveAt > 18000) setMove(move + 1);
  uniforms.uPetals.value = 8 + 8 * Math.round((Math.sin(t * 0.07) + 1) * 0.5);
  stage.psyche.setFold(16);
  stage.render(reduce ? 0 : t, sound.energy());
  stage.clear();
  if (move === 1) drawJaina(t, e); else if (move === 2) drawKhahara(t, e);
  if (now - lastNote > 1600) {                 // I: Sa in a random octave (the same whole at every scale)
    lastNote = now; count++;                     // II: count up the scale, ten notes per ring    III: one note that never changes
    if (move === 0) { const o = Math.floor(Math.random() * 3); sound.why = `always Sa, octave ${o + 1}: the same whole at a different scale`; sound.pluck(SA * 2 ** (o + 1), 0.05); }
    else if (move === 1) { sound.why = `counting: ${count % 10} of 10, then the next ring is ×10`; sound.pluck(degree(count % 10, SA * 2), 0.05); }
    else { sound.why = "khahara: add or take away, it stays the same note"; sound.pluck(SA * 3, 0.05); }
  }
  requestAnimationFrame(frame);
}

setupChamber({ key: "infinity", sound, psyche: stage.psyche, tools: [
  { name: "movement", hint: "show khahara", description: "Show one of the three movements: 'purna' (the Upaniṣad verse, an endless self-similar zoom), 'jaina' (enumerable, innumerable, infinite) or 'khahara' (division by zero).",
    input_schema: { type: "object", properties: { which: { type: "string", enum: ["purna", "jaina", "khahara"] } }, required: ["which"] },
    parse: t => /khahara|zero|divid/.test(t) ? { which: "khahara" } : /jain|innumer|count/.test(t) ? { which: "jaina" } : /purna|pūrṇa|whole|upani|verse/.test(t) ? { which: "purna" } : null,
    run: ({ which }) => { const i = MOVES.findIndex(m => m.key === which); setMove(i < 0 ? 0 : i); return { say: MOVES[move].cap }; } },
] });
setMove(0);
requestAnimationFrame(frame);
