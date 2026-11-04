// flat-stage.js — for chambers drawn in 2D: a WebGL layer underneath (the psyche
// kaleidoscope, or a chamber's own full-screen shader) and a 2D "ink" canvas on top
// where strokes are drawn with additive blending so overlaps glow.
import * as THREE from "three";
import { createPsyche } from "./psyche.js";

export function createFlatStage({ frag = null, uniforms = {}, gain = 1 } = {}) {
  const gl = document.getElementById("stage"), ink = document.getElementById("ink");
  const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: false });
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
  const psyche = createPsyche(); psyche.uniforms.uGain.value = gain;

  // optional chamber shader drawn on top of the psyche backdrop
  let custom = null;
  if (frag) {
    const u = { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uTrip: psyche.uniforms.uTrip, uPulse: psyche.uniforms.uPulse, ...uniforms };
    const mat = new THREE.ShaderMaterial({ uniforms: u, fragmentShader: frag,
      vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }", depthTest: false, depthWrite: false,
      transparent: true, blending: THREE.AdditiveBlending });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); q.frustumCulled = false;
    custom = { scene: new THREE.Scene(), uniforms: u }; custom.scene.add(q);
  }
  renderer.autoClear = false;

  const ctx = ink.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false); psyche.resize(W, H, renderer.getPixelRatio());
    custom?.uniforms.uRes.value.set(W * renderer.getPixelRatio(), H * renderer.getPixelRatio());
    ink.width = Math.round(W * dpr); ink.height = Math.round(H * dpr);
  }
  addEventListener("resize", resize); resize();

  return {
    psyche, ctx, custom,
    get W() { return W; }, get H() { return H; }, get dpr() { return dpr; },
    clear() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ink.width, ink.height); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); },
    render(t, pulse) {
      psyche.update(t, pulse);
      renderer.clear(); renderer.render(psyche.scene, psyche.camera);
      if (custom) { custom.uniforms.uTime.value = t; renderer.render(custom.scene, psyche.camera); }
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
