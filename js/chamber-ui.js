// chamber-ui.js: everything every chamber shares.
// intro veil, dock, trip + volume, the how-to-play tour, the colour key, "why this sound",
// arrows to the next and previous chamber, the notebook drawer and the guide.
// A chamber's own words (tour steps, key, sound mapping, guide answers) come from its
// page.json, which make_pages.py drops into the page as <script id="chamberData">.

import { createGuide } from "./guide.js";
import { CHAMBERS } from "./chambers.js";
import { swara } from "./sound.js";

export async function setupChamber({ key, sound, psyche, onEnter, tools = [] }) {
  const $ = id => document.getElementById(id);
  const data = JSON.parse($("chamberData")?.textContent || "{}");
  const root = document.querySelector('meta[name="site-root"]')?.content ?? "../../";
  const here = CHAMBERS.findIndex(c => c.slug === key);
  const seen = (() => { try { return localStorage.getItem("ananta-tour-" + key) === "done"; } catch { return false; } })();

  // ---- intro veil. first visit: the tour opens straight after
  const enter = withSound => { $("veil").classList.add("gone"); if (withSound) start(); wake(); onEnter?.(); if (!seen && data.tutorial?.length) setTimeout(() => tour.open(0), 900); };
  $("begin")?.addEventListener("click", () => enter(true));
  $("silent")?.addEventListener("click", () => enter(false));

  // ---- sound + volume
  const btn = $("soundBtn"), vol = $("vol");
  async function start() { await sound.start(); btn?.setAttribute("aria-pressed", "true"); }
  function stop() { sound.stop(); btn?.setAttribute("aria-pressed", "false"); }
  btn?.addEventListener("click", () => sound.on ? stop() : start());
  if (vol) {
    vol.value = Math.round(sound.volume * 100);
    vol.addEventListener("input", () => { sound.setVolume(vol.value / 100); if (!sound.on && vol.value > 0) start(); });
  }

  // ---- trip slider: how strong the psychedelic layer is
  const trip = $("trip");
  if (trip) {
    const set = () => { psyche.uniforms.uTrip.value = trip.value / 100; };
    trip.addEventListener("input", set); set();
  }

  // ---- idle fade
  let idle = null;
  function wake() { document.body.classList.remove("idle"); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add("idle"), 4000); }
  ["pointermove", "pointerdown", "keydown"].forEach(ev => addEventListener(ev, wake));

  // ---- arrows to the neighbouring chambers, and a menu of all of them
  const hop = (c, dir) => c ? `<a class="hop ${dir}" href="${root}chambers/${c.slug}/" aria-label="${dir === "prev" ? "Previous" : "Next"} chamber: ${c.name}">
      <span class="arrow">${dir === "prev" ? "‹" : "›"}</span><span class="hop-name"><small>${dir === "prev" ? "previous" : "next"}</small><span lang="sa">${c.deva}</span>${c.name.split(" · ")[0]}</span></a>` : "";
  document.body.insertAdjacentHTML("beforeend", hop(CHAMBERS[here - 1], "prev") + hop(CHAMBERS[here + 1], "next"));
  const crumbs = document.querySelector(".crumbs");
  if (crumbs) {
    crumbs.insertAdjacentHTML("beforeend", `<details class="menu"><summary>all chambers</summary><ol>${CHAMBERS.map((c, i) =>
      `<li><a href="${root}chambers/${c.slug}/"${i === here ? ' aria-current="page"' : ""}><b>${String(i + 1).padStart(2, "0")}</b> ${c.name}</a></li>`).join("")}</ol></details>`);
  }

  // ---- the colour key
  if (data.legend?.length) {
    $("key").innerHTML = `<b>key</b>` + data.legend.map(([c, txt]) =>
      `<span><i style="${c.startsWith("--") ? `border-bottom:2px dashed ${c.slice(2)}` : `background:${c}`}"></i>${txt}</span>`).join("");
  } else $("key")?.remove();

  // ---- why this sound: the chamber's mapping, then each note as it plays and what chose it
  const whyBox = $("whySound"), whyBtn = $("whyBtn"), log = $("notesLog");
  $("whyText").innerHTML = data.sound || "";
  const showWhy = open => { whyBox.hidden = !open; whyBtn?.setAttribute("aria-pressed", String(open)); if (open) tour.close(); };
  whyBtn?.addEventListener("click", () => showWhy(whyBox.hidden));
  $("whyClose")?.addEventListener("click", () => showWhy(false));
  let first = true;
  sound.onNote = ({ kind, f, why }) => {
    if (whyBox.hidden) return;
    if (first) { log.innerHTML = ""; first = false; }
    const s = swara(f), li = document.createElement("li");
    li.innerHTML = `<span class="k">${kind === "bowl" ? "bowl" : "santoor"}</span> <b>${s.label}</b> <span class="dim">${f.toFixed(1)} Hz</span>${why ? `<span class="why">← ${why}</span>` : ""}`;
    log.prepend(li); while (log.children.length > 5) log.lastChild.remove();
  };

  // ---- notebook drawer
  const nb = $("notebook"), nbBtn = $("notesBtn");
  const toggleNb = open => { nb.classList.toggle("open", open); nbBtn?.setAttribute("aria-pressed", String(open)); };
  nbBtn?.addEventListener("click", () => toggleNb(!nb.classList.contains("open")));
  nb.querySelector(".close")?.addEventListener("click", () => toggleNb(false));
  const typing = () => ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  addEventListener("keydown", e => {
    if (e.key === "Escape") { toggleNb(false); tour.close(); showWhy(false); }
    if (typing() || e.metaKey || e.ctrlKey) return;
    if (e.key === "n") toggleNb(!nb.classList.contains("open"));
    if (e.key === "?") tour.isOpen() ? tour.close() : tour.open(0);
    if (e.key === "ArrowRight" && e.shiftKey && CHAMBERS[here + 1]) location.href = `${root}chambers/${CHAMBERS[here + 1].slug}/`;
    if (e.key === "ArrowLeft" && e.shiftKey && CHAMBERS[here - 1]) location.href = `${root}chambers/${CHAMBERS[here - 1].slug}/`;
  });

  // ---- sources, from the shared bibliography
  try {
    const all = await (await fetch(root + "data/sources.json")).json();
    const list = [...(all[key] ?? []), ...all.general];
    $("sources").innerHTML = list.map(s =>
      `<li id="src-${s.id}"><code>[${s.id}]</code> ${s.cite} <a href="${s.url}" target="_blank" rel="noopener">record ↗</a><span class="why">${s.why}</span></li>`).join("");
  } catch {
    $("sources").innerHTML = `<li class="dim">Couldn't load the bibliography. Open this page through a web server (see README), not as a file.</li>`;
  }

  // ---- things the guide can do in every chamber, on top of the chamber's own tools
  const go = c => { location.href = `${root}chambers/${c.slug}/`; return { say: `Walking to ${c.name}.` }; };
  const shared = [
    { name: "set_trip", hint: "trip 0",
      parse: t => { const m = t.match(/(?:trip|psychedelic|haze|background)\D*(\d+)/) || (/more psychedelic|trippier|wilder/.test(t) && [0, 95]) || (/calm|less psychedelic|clearer|just the math|plain/.test(t) && [0, 0]); return m ? { level: +m[1] } : null; },
      run: ({ level }) => { if (trip) { trip.value = level; trip.dispatchEvent(new Event("input")); } return { say: level === 0 ? "Background off: only the math is left on screen." : `Trip set to ${level}.` }; } },
    { name: "volume", hint: "volume 40",
      parse: t => { const m = t.match(/vol(?:ume)?\D*(\d+)/); if (m) return { v: +m[1] }; if (/louder|turn (it )?up/.test(t)) return { d: 15 }; if (/quieter|softer|turn (it )?down/.test(t)) return { d: -15 }; if (/\bmute\b|sound off|stop (the )?(sound|music)/.test(t)) return { v: 0 }; if (/sound on|play (the )?(sound|music)|unmute/.test(t)) return { on: true }; return null; },
      run: ({ v, d, on }) => { if (on) { start(); return { say: "Sound on." }; }
        const nv = v ?? Math.round(sound.volume * 100) + d; sound.setVolume(nv / 100); if (vol) vol.value = Math.max(0, Math.min(100, nv));
        if (nv > 0 && !sound.on) start(); return { say: nv <= 0 ? "Muted." : `Volume ${Math.max(0, Math.min(100, nv))}.` }; } },
    { name: "why_sound", hint: "why this sound", parse: t => /why (this|these|the) (sound|note|music|frequenc)|what.*(hearing|playing)|explain the (sound|music)/.test(t) ? {} : null,
      run: () => { showWhy(true); return { say: "Opened 'why this sound'. " + (data.sound ? data.sound.replace(/<[^>]+>/g, "").split(". ").slice(0, 2).join(". ") + "." : "") }; } },
    { name: "tour", hint: "how do I play", parse: t => /how (do i|to) (play|use|start)|tutorial|walk ?through|teach me|tour|start over|from the (start|beginning)/.test(t) ? {} : null,
      run: () => { tour.open(0); return { say: "Starting the walkthrough. Press next when you're ready." }; } },
    { name: "notebook", hint: "open the notebook", parse: t => /notebook|sources|citations?|papers?|proof|derivation/.test(t) ? {} : null,
      run: () => { toggleNb(true); return { say: "The notebook has the history, the math written out, and the sources." }; } },
    { name: "next_chamber", hint: "next chamber",
      parse: t => { if (/next (chamber|room|one)|go (on|forward)/.test(t)) return { i: here + 1 }; if (/previous|prev |last (chamber|room)|go back/.test(t)) return { i: here - 1 };
        const m = t.match(/(?:go to|take me to|open|show me the|visit)\s+(?:the\s+)?([\wāīūṛṣṇśḥṃ]+)/); if (!m) return null;
        const w = m[1].normalize("NFD").replace(/[̀-ͯ]/g, "");
        const i = CHAMBERS.findIndex(c => c.slug.startsWith(w.slice(0, 4)) || c.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(w));
        return i >= 0 && w.length > 3 ? { i } : null; },
      run: ({ i }) => CHAMBERS[i] ? go(CHAMBERS[i]) : { say: i < 0 ? "This is the first chamber." : "This is the last chamber, for now." } },
  ];
  const guide = createGuide({ chamber: CHAMBERS[here]?.name ?? document.title, tools: [...tools, ...shared], faq: data.faq ?? [] });

  // ---- how to play: one card per step, each step can change the scene through the guide
  const tour = (() => {
    const box = $("tour"), steps = data.tutorial ?? [], tb = $("tourBtn");
    let i = 0;
    const show = () => {
      const s = steps[i];
      $("tourN").textContent = `how to play · ${i + 1} of ${steps.length}`;
      $("tourT").textContent = s.t; $("tourB").innerHTML = s.b; $("tourSee").innerHTML = s.see ? `<b>look for</b> ${s.see}` : "";
      $("tourBack").disabled = i === 0;
      $("tourNext").textContent = i === steps.length - 1 ? (CHAMBERS[here + 1] ? "done ✓" : "done ✓") : "next →";
      if (s.do) guide.exec(s.do, { quiet: true });
      if (window.renderMathInElement) window.renderMathInElement(box, { delimiters: [{ left: "\\(", right: "\\)", display: false }] });
    };
    const open = k => { if (!steps.length) return; i = k; box.hidden = false; tb?.setAttribute("aria-pressed", "true"); showWhy(false); show(); };
    const close = () => { if (box.hidden) return; box.hidden = true; tb?.setAttribute("aria-pressed", "false"); try { localStorage.setItem("ananta-tour-" + key, "done"); } catch {} };
    $("tourNext").addEventListener("click", () => { if (i < steps.length - 1) { i++; show(); } else close(); });
    $("tourBack").addEventListener("click", () => { if (i > 0) { i--; show(); } });
    $("tourClose").addEventListener("click", close);
    tb?.addEventListener("click", () => box.hidden ? open(0) : close());
    if (!steps.length) tb?.remove();
    return { open, close, isOpen: () => !box.hidden };
  })();

  // ---- render TeX in the notebook if KaTeX loaded
  if (window.renderMathInElement) {
    window.renderMathInElement(nb, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }] });
  }
  return { wake, guide, tour };
}
