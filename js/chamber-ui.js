// chamber-ui.js — the pieces every chamber page shares:
// the intro veil, idle-fading dock, the "trip" slider, the sound toggle,
// and the notebook drawer that renders a chamber's notes and its sources.

import { createGuide } from "./guide.js";

export async function setupChamber({ key, sound, psyche, onEnter, tools = [] }) {
  const $ = id => document.getElementById(id);

  // ---- intro veil
  const enter = withSound => { $("veil").classList.add("gone"); if (withSound) start(); wake(); onEnter?.(); };
  $("begin")?.addEventListener("click", () => enter(true));
  $("silent")?.addEventListener("click", () => enter(false));

  // ---- sound
  const btn = $("soundBtn");
  async function start() { await sound.start(); btn?.setAttribute("aria-pressed", "true"); }
  function stop() { sound.stop(); btn?.setAttribute("aria-pressed", "false"); }
  btn?.addEventListener("click", () => sound.on ? stop() : start());

  // ---- trip slider: how loud the psychedelic layer is
  const trip = $("trip");
  if (trip) {
    const set = () => { psyche.uniforms.uTrip.value = trip.value / 100; };
    trip.addEventListener("input", set); set();
  }

  // ---- idle fade
  let idle = null;
  function wake() { document.body.classList.remove("idle"); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add("idle"), 4000); }
  ["pointermove", "pointerdown", "keydown"].forEach(ev => addEventListener(ev, wake));

  // ---- notebook drawer
  const nb = $("notebook"), nbBtn = $("notesBtn");
  const toggle = open => { nb.classList.toggle("open", open); nbBtn?.setAttribute("aria-pressed", String(open)); };
  nbBtn?.addEventListener("click", () => toggle(!nb.classList.contains("open")));
  nb.querySelector(".close")?.addEventListener("click", () => toggle(false));
  addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); if (e.key === "n" && !e.metaKey && !e.ctrlKey) toggle(!nb.classList.contains("open")); });

  // ---- sources, from the shared bibliography
  try {
    const base = document.querySelector('meta[name="site-root"]')?.content ?? "../../";
    const all = await (await fetch(base + "data/sources.json")).json();
    const list = [...(all[key] ?? []), ...all.general];
    $("sources").innerHTML = list.map(s =>
      `<li id="src-${s.id}"><code>[${s.id}]</code> ${s.cite} <a href="${s.url}" target="_blank" rel="noopener">record ↗</a><span class="why">${s.why}</span></li>`).join("");
  } catch {
    $("sources").innerHTML = `<li class="dim">Couldn't load the bibliography. Open this page through a web server (see README), not as a file.</li>`;
  }

  // ---- the guide: plain-language control of this chamber
  tools = [...tools, {
    name: "set_trip", hint: "trip 90", description: "Set how intense the psychedelic background is, 0 (calm) to 100 (full).",
    input_schema: { type: "object", properties: { level: { type: "number", minimum: 0, maximum: 100 } }, required: ["level"] },
    parse: t => { const m = t.match(/(?:trip|psychedelic|intens\w*)\D*(\d+)/) || (/more psychedelic|trippier|wilder/.test(t) && [0, 95]) || (/calm|less psychedelic|quieter/.test(t) && [0, 15]); return m ? { level: +m[1] } : null; },
    run: ({ level }) => { if (trip) { trip.value = level; trip.dispatchEvent(new Event("input")); } return { say: `Trip set to ${level}.` }; },
  }];
  if (tools.length) createGuide({ chamber: document.title, tools, context: () => nb.innerText.slice(0, 7000) });

  // ---- render TeX in the notebook if KaTeX loaded
  if (window.renderMathInElement) {
    window.renderMathInElement(nb, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }] });
  }
  return { wake };
}
