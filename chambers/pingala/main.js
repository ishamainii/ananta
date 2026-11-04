// chamber 01 · chandas — Pingala's meters as the corners of an n-cube.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createPsyche } from "../../js/psyche.js";
import { createSound, degree, SA } from "../../js/sound.js";
import { setupChamber } from "../../js/chamber-ui.js";
import { toNum } from "../../js/guide.js";
import { glowTexture, additive, ease } from "../../js/scene-kit.js";

const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const HEX = ["#ffcf6b", "#ff8a3d", "#ff5c8a", "#b08cff", "#5fd4ff", "#5fe3b2", "#fff0d6"];  // one light per syllable
const PAL = HEX.map(c => new THREE.Color(c));
const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
const DEV = "०१२३४५६७८९", dev = k => String(k).split("").map(d => DEV[+d]).join("");
const pop = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
const gray = i => i ^ (i >> 1);

// ---------- renderer: psychedelic backdrop, then the cube, then bloom ----------
const canvas = $("stage");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.autoClear = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(2.6, 1.7, 5.6);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, dampingFactor: 0.06, enablePan: false, minDistance: 3.2, maxDistance: 12, autoRotate: !reduce, autoRotateSpeed: 0.35 });

const psyche = createPsyche();
psyche.uniforms.uGain.value = 0.42;      // bloom brightens everything, so the backdrop sits lower here
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(psyche.scene, psyche.camera));
const main = new RenderPass(scene, camera); main.clear = false; composer.addPass(main);
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.8, 0.5, 0.18); composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = innerWidth, h = innerHeight, dpr = renderer.getPixelRatio();
  renderer.setSize(w, h, false); composer.setSize(w, h); psyche.resize(w, h, dpr);
  camera.aspect = w / h; camera.fov = w < h ? 60 : 45; camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();

const GLOW = glowTexture();

// ---------- the n-cube ----------
let n = 4, V = [], E = [], Bd = [], D = 3, S = 1, edgeMesh = null, vertMesh = null, birth = 0;
const cube = new THREE.Group(); scene.add(cube);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 7, 1, true), BALL = new THREE.SphereGeometry(1, 12, 10);
const edgeMat = new THREE.MeshBasicMaterial(additive({ opacity: 0.95 }));
const vertMat = new THREE.MeshBasicMaterial(additive({ opacity: 1 }));
const MAXQ = 32;
const faceGeo = new THREE.BufferGeometry(); faceGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAXQ * 18), 3));
const faceMat = new THREE.MeshBasicMaterial(additive({ color: 0xffc070, opacity: 0, side: THREE.DoubleSide }));
const faces = new THREE.Mesh(faceGeo, faceMat); faces.frustumCulled = false; cube.add(faces);
const walker = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6dc }));
const walkerGlow = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: GLOW, color: 0xffc66a, opacity: 0.95 })));
cube.add(walker, walkerGlow);
const TRAIL = 90, trailPos = new Float32Array(TRAIL * 3), trailCol = new Float32Array(TRAIL * 3);
for (let i = 0; i < TRAIL; i++) { const f = (1 - i / TRAIL) ** 1.6; trailCol.set([f, 0.75 * f, 0.35 * f], i * 3); }
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3)); trailGeo.setAttribute("color", new THREE.BufferAttribute(trailCol, 3));
const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial(additive({ vertexColors: true }))); trail.frustumCulled = false; cube.add(trail);

const eye = m => Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => +(i === j)));
const mul = (M, v) => M.map(r => r.reduce((s, x, k) => s + x * v[k], 0));
function rotRight(M, i, j, th) { const c = Math.cos(th), s = Math.sin(th); for (const r of M) { const a = r[i], b = r[j]; r[i] = c * a + s * b; r[j] = -s * a + c * b; } }
function proj3(x) {                               // pinhole camera once per extra dimension
  const p = x.slice(); let depth = 1;
  while (p.length > 3) { const w = p.pop(), f = 1 / (D - w); depth *= f; for (let k = 0; k < p.length; k++) p[k] *= f; }
  while (p.length < 3) p.push(0);
  return [p[0] * S, p[1] * S, p[2] * S, depth];
}
const bitOf = p => 1 << (n - 1 - p);
const planesAll = m => { const o = []; for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) o.push([i, j]); return o; };
const hiddenPlanes = () => n <= 3 ? planesAll(n) : planesAll(n).filter(([, b]) => b >= 3);

function build(m) {
  n = m; V = []; E = [];
  for (let v = 0; v < 1 << n; v++) V.push(Array.from({ length: n }, (_, p) => ((v >> (n - 1 - p)) & 1) ? 1 : -1));
  for (let i = 0; i < 1 << n; i++) for (let b = 0; b < n; b++) { const j = i ^ (1 << b); if (j > i) E.push([i, j, n - 1 - b]); }
  Bd = eye(n); D = Math.sqrt(n) + (n > 4 ? 0.9 : 1.15);
  S = 1; let mx = 0;                              // fit: the widest pose over random turns
  for (let s = 0; s < 30; s++) {
    const T = eye(n); planesAll(n).forEach(([i, j]) => rotRight(T, i, j, Math.random() * 6.28));
    for (const v of V) { const q = proj3(mul(T, v)); mx = Math.max(mx, Math.hypot(q[0], q[1], q[2])); }
  }
  S = 1.75 / mx;
  if (edgeMesh) { cube.remove(edgeMesh, vertMesh); edgeMesh.dispose(); vertMesh.dispose(); }
  edgeMesh = new THREE.InstancedMesh(CYL, edgeMat, E.length); edgeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  vertMesh = new THREE.InstancedMesh(BALL, vertMat, V.length); vertMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  E.forEach((_, q) => edgeMesh.setColorAt(q, PAL[0])); V.forEach((_, i) => vertMesh.setColorAt(i, PAL[6]));
  edgeMesh.frustumCulled = vertMesh.frustumCulled = false; cube.add(edgeMesh, vertMesh);
  step = 0; stepT0 = performance.now(); turn = null; nextTurnAt = performance.now() + 1800; cycleIdx = 0; shownPlane = null;
  trailFilled = false; birth = performance.now();
  psyche.setFold(2 * n);
  renderCaption(); renderPlaneCap();
  document.querySelectorAll("#dims button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.n === n)));
}

// ---------- plane turns ----------
let turn = null, nextTurnAt = 0, cycleIdx = 0, shownPlane = null, pending = null;
const TURN_MS = 4200, PAUSE_MS = 2600;
function stepTurns(now) {
  if (!turn) {
    if (pending || now >= nextTurnAt) {
      const hp = hiddenPlanes(), pl = pending ?? hp[cycleIdx++ % hp.length]; pending = null;
      turn = { a: pl[0], b: pl[1], t0: now, done: 0, dir: Math.random() < .5 ? 1 : -1 };
      shownPlane = pl; renderPlaneCap(); sound.bowl();
    }
    return;
  }
  const e = ease(Math.min(1, (now - turn.t0) / TURN_MS)), target = turn.dir * e * Math.PI / 2;
  rotRight(Bd, turn.a, turn.b, target - turn.done); turn.done = target;
  if (e >= 1) { Bd = Bd.map(r => r.map(x => Math.abs(x - Math.round(x)) < 0.02 ? Math.round(x) : x)); turn = null; nextTurnAt = now + PAUSE_MS; }
}

// ---------- the walk ----------
let step = 0, stepT0 = 0, trailFilled = false;
const STEP_MS = 1700;
const meterOf = v => Array.from({ length: n }, (_, p) => (v >> (n - 1 - p)) & 1);
const curV = () => gray(step % (1 << n)), prevV = () => gray((step - 1 + (1 << n)) % (1 << n));
const changedSyl = () => step === 0 ? -1 : n - 1 - Math.log2(curV() ^ prevV());

function renderPlaneCap() {
  if (!shownPlane) { $("cap1").textContent = `${n} syllables · ${1 << n} meters · a ${n}-dimensional cube`; return; }
  const [a, b] = shownPlane, dot = p => `<i style="color:${HEX[p]}">${p + 1}</i>`;
  $("cap1").innerHTML = `turning the plane of syllables ${dot(a)} and ${dot(b)}` + (b >= 3 ? ` · through the ${ORD[b]} dimension` : ``);
}
function renderCaption() {
  const bits = meterOf(curV()), ch = changedSyl();
  $("cap2").innerHTML = bits.map((b, p) => `<span class="${p === ch ? "hot" : ""}">${b ? "ऽ" : "।"}</span>`).join("");
}

// ---------- UI ----------
const sound = createSound();
$("dims").innerHTML = [3, 4, 5, 6, 7].map(m => `<button class="chip deva" data-n="${m}" aria-pressed="${m === 4}" aria-label="${m} syllables">${dev(m)}</button>`).join("");
$("dims").querySelectorAll("button").forEach(b => b.addEventListener("click", () => build(+b.dataset.n)));
setupChamber({ key: "pingala", sound, psyche, tools: [
  { name: "set_dimension", hint: "show me 6 dimensions", description: "Show the n-cube for n syllables (3 to 7). Each corner is an n-syllable meter.",
    input_schema: { type: "object", properties: { n: { type: "integer", minimum: 3, maximum: 7 } }, required: ["n"] },
    parse: t => { const m = t.match(/(\d|three|four|five|six|seven)[\s-]*(?:d\b|dim|syllab|cube)/); return m ? { n: toNum(m[1]) } : null; },
    run: ({ n: m }) => { m = Math.max(3, Math.min(7, Math.round(m))); build(m); return { say: `${m} syllables: ${1 << m} meters, ${m * 2 ** (m - 1)} edges.`, n: m }; } },
  { name: "turn_plane", hint: "turn syllables 2 and 5", description: "Start a quarter turn in the plane spanned by two syllable axes (1-based).",
    input_schema: { type: "object", properties: { a: { type: "integer" }, b: { type: "integer" } }, required: ["a", "b"] },
    parse: t => { const m = t.match(/(?:turn|rotate|plane)\D*(\d)\D+(\d)/); return m ? { a: +m[1], b: +m[2] } : null; },
    run: ({ a, b }) => { a = Math.max(1, Math.min(n, a)) - 1; b = Math.max(1, Math.min(n, b)) - 1; if (a === b) return { error: "need two different syllables" };
      if (a > b) [a, b] = [b, a]; pending = [a, b];
      return { say: `${turn ? "Next" : "Now"}: a quarter turn in the plane of syllables ${a + 1} and ${b + 1}.` }; } },
] });

// ---------- frame ----------
const tA = new THREE.Vector3(), tB = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), dummy = new THREE.Object3D(), col = new THREE.Color();
const t0 = performance.now();
function frame(now) {
  stepTurns(now);
  if (now - stepT0 > STEP_MS) { step++; stepT0 = now; renderCaption(); sound.pluck(degree(pop(curV()) + 2, SA * 4)); }

  const P = V.map(v => proj3(mul(Bd, v)));
  let dmin = Infinity, dmax = -Infinity; for (const p of P) { dmin = Math.min(dmin, p[3]); dmax = Math.max(dmax, p[3]); }
  const dn = p => dmax - dmin < 1e-6 ? 0.8 : (p[3] - dmin) / (dmax - dmin);
  const pl = shownPlane, gs = ease(Math.min(1, (now - birth) / 1400));
  cube.scale.setScalar(0.2 + 0.8 * gs);

  E.forEach(([i, j, ax], q) => {
    const a = P[i], b = P[j], d = (dn(a) + dn(b)) / 2, inPl = pl && (ax === pl[0] || ax === pl[1]);
    tA.set(a[0], a[1], a[2]); tB.set(b[0], b[1], b[2]);
    const len = tA.distanceTo(tB) || 1e-4, r = (0.006 + 0.012 * d) * (inPl ? 1.7 : 1) * (n > 5 ? 0.8 : 1);
    dummy.position.copy(tA).add(tB).multiplyScalar(0.5);
    dummy.quaternion.setFromUnitVectors(UP, tB.sub(tA).normalize());
    dummy.scale.set(r, len, r); dummy.updateMatrix(); edgeMesh.setMatrixAt(q, dummy.matrix);
    col.copy(PAL[ax % PAL.length]).multiplyScalar((0.12 + 0.6 * d) * (pl ? (inPl ? 1.25 : 0.38) : 1) * gs); edgeMesh.setColorAt(q, col);
  });
  edgeMesh.instanceMatrix.needsUpdate = true; edgeMesh.instanceColor.needsUpdate = true;
  P.forEach((p, i) => {
    const d = dn(p); dummy.position.set(p[0], p[1], p[2]); dummy.quaternion.identity(); dummy.scale.setScalar(0.014 + 0.026 * d); dummy.updateMatrix();
    vertMesh.setMatrixAt(i, dummy.matrix); col.copy(PAL[6]).multiplyScalar((0.25 + 0.6 * d) * gs); vertMesh.setColorAt(i, col);
  });
  vertMesh.instanceMatrix.needsUpdate = true; vertMesh.instanceColor.needsUpdate = true;

  let nq = 0;                                     // panes: the squares lying in the turning plane
  if (pl) {
    const A = bitOf(pl[0]), B = bitOf(pl[1]), pos = faceGeo.attributes.position.array;
    for (let v = 0; v < 1 << n && nq < MAXQ; v++) if (!(v & A) && !(v & B)) {
      const c = [v, v | A, v | A | B, v | B].map(i => P[i]);
      [c[0], c[1], c[2], c[0], c[2], c[3]].forEach((p, k) => pos.set([p[0], p[1], p[2]], (nq * 6 + k) * 3)); nq++;
    }
    faceGeo.attributes.position.needsUpdate = true; faceMat.color.copy(PAL[pl[0]]).lerp(PAL[pl[1]], 0.5);
  }
  faceGeo.setDrawRange(0, nq * 6);
  faceMat.opacity += ((pl ? (turn ? 0.085 : 0.04) : 0) - faceMat.opacity) * 0.05;

  const u = step === 0 ? 1 : ease(Math.min(1, (now - stepT0) / 650)), pa = P[prevV()], pc = P[curV()];
  walker.position.set(pa[0] + (pc[0] - pa[0]) * u, pa[1] + (pc[1] - pa[1]) * u, pa[2] + (pc[2] - pa[2]) * u);
  walkerGlow.position.copy(walker.position); walkerGlow.scale.setScalar(0.6 + 0.15 * Math.sin(now / 220));
  if (!trailFilled) { for (let i = 0; i < TRAIL; i++) trailPos.set(walker.position.toArray(), i * 3); trailFilled = true; }
  trailPos.copyWithin(3, 0, (TRAIL - 1) * 3); trailPos.set(walker.position.toArray(), 0); trailGeo.attributes.position.needsUpdate = true;

  psyche.uniforms.uHue.value = pl ? (pl[1] / 7) * 0.25 : 0;
  psyche.update(reduce ? 0 : (now - t0) / 1000, sound.energy());
  controls.update();
  renderer.clear(); composer.render();
  requestAnimationFrame(frame);
}

build(4);
requestAnimationFrame(frame);
