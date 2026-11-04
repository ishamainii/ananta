// scene-kit.js — small helpers shared by the three.js chambers.
import * as THREE from "three";

export const ease = t => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// additive, unlit, untonemapped: what you want for things made of light
export const additive = (opts = {}) => ({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, ...opts });

// a soft radial dot, used for glows, stars and sparks
export function glowTexture(size = 128) {
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d");
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,230,180,.55)"); r.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = r; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
