// flat-stage.js — the stage for chambers whose math is drawn in 2D.
//
// The 2D drawing ("ink") is still drawn with the canvas API, but it is no longer pasted on the
// screen. It becomes a texture on a glass panel floating in a 3D room, and the coloured light is a
// dome all round you. You can drag to walk round the panel, scroll or pinch to move into it, and
// double-click to come back. A chamber with its own full-screen shader (Ramanujan, Pūrṇa) renders
// that shader into a texture first, so it lives on the panel too.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createPsyche, createDome } from "./psyche.js";

export function createFlatStage({ frag = null, uniforms = {}, gain = 1 } = {}) {
  const gl = document.getElementById("stage"), ink = document.getElementById("ink");
  ink.style.visibility = "hidden";                         // drawn offscreen, shown on the panel
  const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true });
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
  const psyche = createPsyche(); psyche.uniforms.uGain.value = gain;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 400);
  const DIST = 5, HOME = new THREE.Vector3(0, 0, DIST);
  camera.position.copy(HOME);
  scene.add(createDome(psyche.uniforms));

  const controls = new OrbitControls(camera, gl);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.07, enablePan: false, minDistance: 0.6, maxDistance: 14, rotateSpeed: 0.6, zoomSpeed: 0.8 });
  gl.addEventListener("dblclick", () => { camera.position.copy(HOME); controls.target.set(0, 0, 0); });
  gl.style.touchAction = "none";

  // the panel: sized so that from the home position it fills the screen exactly, like before
  const inkTex = new THREE.CanvasTexture(ink); inkTex.colorSpace = THREE.SRGBColorSpace;
  const glass = new THREE.MeshBasicMaterial({ map: inkTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glass);
  scene.add(panel);

  // optional chamber shader, rendered off-screen and laid on the panel underneath the ink
  let custom = null, rt = null, under = null;
  if (frag) {
    const u = { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uGlow: psyche.uniforms.uGlow, uPulse: psyche.uniforms.uPulse, ...uniforms };
    const mat = new THREE.ShaderMaterial({ uniforms: u, fragmentShader: frag,
      vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }", depthTest: false, depthWrite: false });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); q.frustumCulled = false;
    custom = { scene: new THREE.Scene(), uniforms: u, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) }; custom.scene.add(q);
    rt = new THREE.WebGLRenderTarget(4, 4);
    under = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    under.position.z = -0.002; scene.add(under);
  }

  const ctx = ink.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false); psyche.resize(W, H, renderer.getPixelRatio());
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const ph = 2 * DIST * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), pw = ph * W / H;
    panel.scale.set(pw, ph, 1); under?.scale.set(pw, ph, 1);
    ink.width = Math.round(W * dpr); ink.height = Math.round(H * dpr);
    if (custom) { const s = renderer.getPixelRatio(); rt.setSize(Math.round(W * s), Math.round(H * s)); custom.uniforms.uRes.value.set(W * s, H * s); }
  }
  addEventListener("resize", resize); resize();

  return {
    psyche, ctx, custom, camera, controls,
    get W() { return W; }, get H() { return H; }, get dpr() { return dpr; },
    home() { camera.position.copy(HOME); controls.target.set(0, 0, 0); },
    clear() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ink.width, ink.height); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); },
    render(t, pulse) {
      psyche.update(t, pulse);
      if (custom) { custom.uniforms.uTime.value = t; renderer.setRenderTarget(rt); renderer.clear(); renderer.render(custom.scene, custom.camera); renderer.setRenderTarget(null); }
      inkTex.needsUpdate = true;
      controls.update();
      renderer.render(scene, camera);
    },
  };
}

// a glowing stroke: a wide faint pass then a thin bright pass, both additive
export function glowLine(ctx, pts, color, width = 1.5, alpha = 1) {
  if (pts.length < 2) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = ctx.lineCap = "round";
  for (const [w, a] of [[width * 6, 0.08], [width * 2.5, 0.22], [width, 0.95]]) {
    ctx.strokeStyle = color; ctx.globalAlpha = a * alpha; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
  }
  ctx.restore();
}
export function glowDot(ctx, x, y, r, color, alpha = 1) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
  g.addColorStop(0, color); g.addColorStop(0.25, color); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 6.2832); ctx.fill();
  ctx.restore();
}
