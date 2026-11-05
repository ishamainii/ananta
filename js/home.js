// home.js — shader sky + the chamber list.
import * as THREE from "three";
import { createPsyche } from "./psyche.js";
import { CHAMBERS } from "./chambers.js";



CHAMBERS.forEach(c => { c.live = true; });
const list = document.getElementById("chamberList");
list.innerHTML = CHAMBERS.map((c, i) => {
  const body = `<span class="num"><span>${String(i + 1).padStart(2, "0")}</span><span class="status">${c.live ? "● live" : "○ soon"}</span></span>
    <span class="deva" lang="sa">${c.deva}</span><h3>${c.name}</h3><p>${c.line}</p><span class="who">${c.who}</span>`;
  return `<li class="chamber${c.live ? " live" : ""}">${c.live ? `<a href="chambers/${c.slug}/">${body}</a>` : `<div class="inner">${body}</div>`}</li>`;
}).join("");

// the sky: the same kaleidoscope the chambers use, slowly cycling its symmetry
const canvas = document.getElementById("sky");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
const psyche = createPsyche();
psyche.uniforms.uGlow.value = 0.7;
function resize() { renderer.setSize(innerWidth, innerHeight, false); psyche.resize(innerWidth, innerHeight, renderer.getPixelRatio()); }
addEventListener("resize", resize); resize();
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const folds = [6, 8, 10, 12, 14, 16];
let last = 0;
function frame(now) {
  const t = now / 1000;
  if (Math.floor(t / 9) !== last) { last = Math.floor(t / 9); psyche.setFold(folds[last % folds.length]); }
  psyche.update(reduce ? 0 : t, 0);
  renderer.render(psyche.scene, psyche.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
