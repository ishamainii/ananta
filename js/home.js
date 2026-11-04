// home.js — shader sky + the chamber list.
import * as THREE from "three";
import { createPsyche } from "./psyche.js";

const CHAMBERS = [
  { slug: "pingala", deva: "छन्दः", name: "Chandas · meters as a hypercube", who: "Pingala, c. 3rd–2nd c. BCE · Halāyudha, 10th c.", line: "Every n-syllable meter is a corner of an n-cube. Watch it turn through the fourth dimension." },
  { slug: "madhava", deva: "माधव", name: "Mādhava · π without end", who: "Mādhava of Saṅgamagrāma, 14th c. · Kerala school", line: "The infinite series for π, and the correction terms that make it converge astonishingly fast." },
  { slug: "chakravala", deva: "चक्रवाल", name: "Chakravāla · the wheel", who: "Jayadeva, 11th c. · Bhāskara II, 12th c.", line: "A cyclic algorithm that solves x² − 61y² = 1 in a few turns of the wheel." },
  { slug: "ramanujan", deva: "रामानुजन्", name: "Ramanujan · partitions and modular forms", who: "S. Ramanujan, 1887–1920", line: "Counting the ways to split a number, and the glowing complex-plane functions behind it." },
  { slug: "sriyantra", deva: "श्रीयन्त्र", name: "Śrī Yantra · an optimisation problem", who: "classical yantra · Kulaichev 1984", line: "Nine interlocking triangles that must meet exactly. Solved live, as a constrained optimisation." },
  { slug: "tatkalika", deva: "तात्कालिक", name: "Tātkālika · the instant and the extreme", who: "Bhāskara II, Siddhānta-śiromaṇi, 1150", line: "Instantaneous motion, and why a planet's correction vanishes at its extreme." },
  { slug: "purna", deva: "पूर्ण", name: "Pūrṇa · orders of infinity", who: "Jaina sutras · Bhāskara II's khahara", line: "Enumerable, innumerable, infinite: an ancient ladder of infinities, and what x / 0 meant." },
];

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
psyche.uniforms.uTrip.value = 0.7;
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
