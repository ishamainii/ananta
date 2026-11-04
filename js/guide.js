// guide.js: "ask the chamber". Plain language in, the scene changes, answers come back.
//
// No server, no model: it's a small command interpreter.
//  1. split the request into clauses ("show 6 dimensions and turn syllables 2 and 5, then explain guru")
//     on commas / "and" / "then" / "also", but glue a bare number back on ("2 and 5" stays together)
//  2. each clause goes to the chamber's tools in order; the first tool whose parse() reads it runs
//  3. a clause that no tool reads (or that is a question) is matched against the chamber's
//     question bank: every entry has keywords, and the entry with the most hits answers
//  4. anything left over gets a short "didn't catch that" with clickable suggestions
// Answers can be read aloud, and on browsers with speech recognition you can talk to it.

export function createGuide({ chamber, tools, faq = [] }) {
  const box = document.createElement("div");
  box.className = "guide"; box.hidden = true;
  const hints = tools.map(t => t.hint).filter(Boolean);
  box.innerHTML = `
    <div class="guide-log" id="guideLog" aria-live="polite"></div>
    <div class="guide-try" id="guideTry"></div>
    <form class="guide-form" id="guideForm">
      <input id="guideIn" autocomplete="off" placeholder="try: ${hints.slice(0, 2).join(" and ")}" aria-label="Ask the guide">
      <button class="chip" type="submit">ask</button>
      <button class="chip" type="button" id="guideMic" aria-pressed="false" title="Speak a request" hidden>🎙</button>
      <button class="chip" type="button" id="guideVoice" aria-pressed="false" title="Read answers aloud">voice</button>
    </form>`;
  document.body.appendChild(box);
  const log = box.querySelector("#guideLog"), input = box.querySelector("#guideIn"), voiceBtn = box.querySelector("#guideVoice");
  const tryBox = box.querySelector("#guideTry");
  const examples = [...hints.slice(0, 5), ...faq.slice(0, 3).map(f => f.q)];
  tryBox.innerHTML = examples.map(e => `<button type="button" class="try">${e}</button>`).join("");
  tryBox.addEventListener("click", e => { if (e.target.matches(".try")) ask(e.target.textContent); });

  let voice = false;
  voiceBtn.addEventListener("click", () => { voice = !voice; voiceBtn.setAttribute("aria-pressed", String(voice)); if (!voice) speechSynthesis?.cancel(); });
  const say = (who, text) => {
    const p = document.createElement("p"); p.className = who; p.textContent = text; log.appendChild(p); log.scrollTop = log.scrollHeight;
    if (who === "bot" && voice && "speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(text.replace(/·/g, ",")); u.rate = 0.97; speechSynthesis.speak(u); }
    return p;
  };

  // ---- understanding
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'").trim();
  function clauses(text) {
    const parts = norm(text).split(/\s*(?:[,;!?]|\.(?=\s|$)|\band then\b|\bthen\b|\balso\b|\band\b|\b&\b)\s*/).filter(Boolean);
    const out = [];
    for (const p of parts) {                       // "turn syllables 2 and 5": the 5 belongs to the clause before it
      if (out.length && /^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)$/.test(p)) out[out.length - 1] += " and " + p;
      else out.push(p);
    }
    return out;
  }
  const isQuestion = c => /^(what|why|how|who|when|where|which|is|are|does|do|can|explain|tell me|define|meaning)\b/.test(c);
  function answer(c) {
    let best = null, bestScore = 0;
    for (const f of faq) {
      const score = f.k.reduce((n, k) => n + (c.includes(norm(k)) ? (k.length > 5 ? 2 : 1) : 0), 0);
      if (score > bestScore) { best = f; bestScore = score; }
    }
    return bestScore ? best.a : null;
  }
  async function runClause(c) {
    if (/^(help|commands|what can (you|i) do|options|menu)\b/.test(c)) return "I can change the scene or answer questions, several at once. Try: " + hints.slice(0, 6).join(" · ") + ".";
    if (/^(hi|hello|hey|namaste)\b/.test(c)) return `Namaste. This is ${chamber}. Ask me to change something, or ask what you're looking at.`;
    if (!isQuestion(c) || /^(show|turn|go|set|play|open)/.test(c)) {
      for (const t of tools) {
        const args = t.parse?.(c);
        if (args) { const r = await t.run(args); return r?.say ?? "Done."; }
      }
    }
    const a = answer(c);
    if (a) return a;
    if (isQuestion(c)) for (const t of tools) { const args = t.parse?.(c); if (args) { const r = await t.run(args); return r?.say ?? "Done."; } }
    return null;
  }
  async function exec(text, { quiet = false } = {}) {
    const said = [], missed = [];
    for (const c of clauses(text)) { const r = await runClause(c); r ? said.push(r) : missed.push(c); }
    if (!quiet) {
      if (said.length) say("bot", said.join(" "));
      if (missed.length) say("bot dim", `I didn't catch "${missed.join(`", "`)}". Tap a suggestion below, or say "help".`);
    }
    return said;
  }
  async function ask(text) { say("you", text); await exec(text); }

  box.querySelector("#guideForm").addEventListener("submit", e => {
    e.preventDefault(); const text = input.value.trim(); if (!text) return; input.value = ""; ask(text);
  });

  // ---- talking to it, where the browser supports speech recognition
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = box.querySelector("#guideMic");
  if (SR) {
    mic.hidden = false;
    const rec = new SR(); rec.lang = "en-US"; rec.interimResults = true;
    rec.onresult = e => { const r = [...e.results].map(x => x[0].transcript).join(""); input.value = r; if (e.results[e.results.length - 1].isFinal) { input.value = ""; ask(r); } };
    rec.onend = () => mic.setAttribute("aria-pressed", "false");
    mic.addEventListener("click", () => { if (mic.getAttribute("aria-pressed") === "true") rec.stop(); else { voice = true; voiceBtn.setAttribute("aria-pressed", "true"); mic.setAttribute("aria-pressed", "true"); rec.start(); } });
  }

  const toggle = open => { box.hidden = !open; document.getElementById("guideBtn")?.setAttribute("aria-pressed", String(open)); if (open) { input.focus(); if (!log.children.length) say("bot dim", `Ask me to change the scene or explain it. You can chain requests: "${hints[0] ?? "help"} and ${hints[1] ?? "why this sound"}".`); } };
  document.getElementById("guideBtn")?.addEventListener("click", () => toggle(box.hidden));
  addEventListener("keydown", e => { if (e.key === "g" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) { e.preventDefault(); toggle(box.hidden); } });
  return { toggle, exec, ask };
}

// helpers for parsing
export const num = (text, re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
export const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
export const toNum = s => WORDNUM[s] ?? Number(s);
