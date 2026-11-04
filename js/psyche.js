// psyche.js — the psychedelic layer behind every chamber.
//
// A full-screen fragment shader drawn before the main scene. Three ideas:
//   1. Kaleidoscope: the angle is folded into `fold` mirrored wedges, so the
//      symmetry of the backdrop matches the object in front (2n wedges for an n-cube).
//   2. Log-polar zoom: we work in (angle, log r). Sliding log r forward with time
//      is a zoom that never ends, which is the closest a picture gets to ananta.
//   3. Domain warping: fbm noise fed back into itself (Inigo Quilez's trick)
//      makes the colour flow like oil on water.
// `trip` (0..1) scales how loud the colour is; `gain` lets a page with bloom turn it down;
// `pulse` follows the music.

import * as THREE from "three";

const frag = /* glsl */ `
precision highp float;
uniform float uTime, uTrip, uPulse, uFold, uHue, uGain;
uniform vec2 uRes;
varying vec2 vUv;

// cosine palette: a + b*cos(2pi(c*t + d)), tuned to saffron / rose / indigo
vec3 pal(float t) {
  vec3 a = vec3(0.50, 0.32, 0.42), b = vec3(0.50, 0.38, 0.40);
  vec3 c = vec3(1.00, 1.00, 1.00), d = vec3(0.02 + uHue, 0.18 + uHue, 0.55 + uHue);
  return a + b * cos(6.28318 * (c * t + d));
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float r = length(p), a = atan(p.y, p.x);
  float seg = 6.28318 / uFold;                 // kaleidoscope: fold the angle into mirrored wedges
  a = mod(a, seg); a = abs(a - 0.5 * seg);
  float lr = log(r + 1e-3) - uTime * 0.07;      // log-polar: moving log r is an endless zoom
  vec2 q = vec2(a * 2.6, lr * 1.7);
  vec2 w = vec2(fbm(q + uTime * 0.03), fbm(q + vec2(5.2, 1.3) - uTime * 0.025));
  float n = fbm(q + 2.2 * w);                   // domain warp
  float rings = 0.5 + 0.5 * sin(lr * 9.0 + n * 5.0 - uTime * 0.4);
  float petals = 0.5 + 0.5 * cos(a * uFold * 1.0 + n * 3.0);
  vec3 col = pal(n * 1.4 + lr * 0.12 + uTime * 0.015);
  col *= 0.35 + 0.65 * rings * (0.6 + 0.4 * petals);
  float vig = smoothstep(1.25, 0.2, r) * smoothstep(0.04, 0.5, r);  // keep the centre calm for the object
  col *= vig * mix(0.05, 0.42, uTrip) * uGain * (1.0 + 0.9 * uPulse);
  gl_FragColor = vec4(col, 1.0);
}`;

export function createPsyche() {
  const uniforms = {
    uTime: { value: 0 }, uTrip: { value: 0.55 }, uPulse: { value: 0 },
    uFold: { value: 8 }, uHue: { value: 0 }, uGain: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fragmentShader: frag,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    depthWrite: false, depthTest: false, toneMapped: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let fold = 8;
  return {
    scene, camera, uniforms,
    resize(w, h, dpr) { uniforms.uRes.value.set(w * dpr, h * dpr); },
    setFold(f) { fold = f; },
    update(t, pulse) {
      uniforms.uTime.value = t;
      uniforms.uFold.value += (fold - uniforms.uFold.value) * 0.04;   // glide between symmetries
      uniforms.uPulse.value += (pulse - uniforms.uPulse.value) * 0.15;
    },
  };
}
