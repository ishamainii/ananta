// guide.js — "ask the chamber". The visitor types in plain language and the scene answers.
//
// Each chamber registers tools: { name, description, input_schema, run(args), parse?(text) }.
//  * online  (a proxy URL is set in js/config.js): the message, the chamber's notes and the
//    tool schemas go to the LLM; tool calls it makes are executed here, on the live scene,
//    and their results are sent back until it answers. The answer can be read aloud.
//  * offline (no proxy): each tool's parse() tries to read the request directly, so
//    "show me 6 dimensions" still works on a static host.
import { GUIDE_URL, GUIDE_MODEL } from "./config.js";

export function createGuide({ chamber, tools, context }) {
  const box = document.createElement("div");
  box.className = "guide"; box.hidden = true;
  box.innerHTML = `
    <div class="guide-log" id="guideLog" aria-live="polite"></div>
    <form class="guide-form" id="guideForm">
      <input id="guideIn" autocomplete="off" placeholder="${tools[0]?.hint ?? "ask anything about this chamber"}" aria-label="Ask the guide">
      <button class="chip" type="submit">ask</button>
      <button class="chip" type="button" id="guideVoice" aria-pressed="false" title="Read answers aloud">voice</button>
    </form>`;
  document.body.appendChild(box);
  const log = box.querySelector("#guideLog"), input = box.querySelector("#guideIn"), voiceBtn = box.querySelector("#guideVoice");
  let voice = false, history = [];
  voiceBtn.addEventListener("click", () => { voice = !voice; voiceBtn.setAttribute("aria-pressed", String(voice)); if (!voice) speechSynthesis?.cancel(); });

  const say = (who, text) => {
    const p = document.createElement("p"); p.className = who; p.textContent = text; log.appendChild(p); log.scrollTop = log.scrollHeight;
    if (who === "bot" && voice && "speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.pitch = 0.9; speechSynthesis.speak(u); }
    return p;
  };
  const byName = Object.fromEntries(tools.map(t => [t.name, t]));

  async function offline(text) {
    for (const t of tools) {
      const args = t.parse?.(text.toLowerCase());
      if (args) { const r = await t.run(args); say("bot", r?.say ?? "Done."); return; }
    }
    say("bot", "Offline guide: I can do " + tools.map(t => t.hint).filter(Boolean).join(" · ") + ".");
  }

  async function online(text) {
    history.push({ role: "user", content: text });
    const system = `You are the guide inside "${chamber}", one chamber of Ananta, an interactive site on Indian mathematics by Isha Maini. ` +
      `Change the live visualization with the tools whenever the visitor asks to see something. Answer in at most 3 short sentences, ` +
      `precise and a little poetic. Only state history that appears in the context below; cite sources by their id in square brackets.\n\nCONTEXT:\n${context()}`;
    const schemas = tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }));
    for (let turn = 0; turn < 5; turn++) {
      const res = await fetch(GUIDE_URL, { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: GUIDE_MODEL, max_tokens: 400, system, tools: schemas, messages: history }) });
      if (!res.ok) throw new Error(`guide ${res.status}`);
      const msg = await res.json();
      history.push({ role: "assistant", content: msg.content });
      const text = msg.content.filter(b => b.type === "text").map(b => b.text).join(" ").trim();
      if (text) say("bot", text);
      const calls = msg.content.filter(b => b.type === "tool_use");
      if (!calls.length) return;
      const results = [];
      for (const c of calls) {
        let out; try { out = await byName[c.name].run(c.input); } catch (e) { out = { error: String(e) }; }
        results.push({ type: "tool_result", tool_use_id: c.id, content: JSON.stringify(out ?? { ok: true }) });
      }
      history.push({ role: "user", content: results });
    }
  }

  box.querySelector("#guideForm").addEventListener("submit", async e => {
    e.preventDefault(); const text = input.value.trim(); if (!text) return; input.value = ""; say("you", text);
    const thinking = say("bot dim", "…");
    try { if (GUIDE_URL) await online(text); else await offline(text); }
    catch { await offline(text); }
    finally { thinking.remove(); }
  });

  const toggle = open => { box.hidden = !open; document.getElementById("guideBtn")?.setAttribute("aria-pressed", String(open)); if (open) input.focus(); };
  document.getElementById("guideBtn")?.addEventListener("click", () => toggle(box.hidden));
  addEventListener("keydown", e => { if (e.key === "g" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); toggle(box.hidden); } });
  return { toggle };
}

// helpers for offline parsing
export const num = (text, re) => { const m = text.match(re); return m ? Number(m[1]) : null; };
export const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
export const toNum = s => WORDNUM[s] ?? Number(s);
