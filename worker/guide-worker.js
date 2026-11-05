// Cloudflare Worker: the AI guide's brain, on Workers AI (free tier: 10,000 neurons a day,
// no API key, no card). The site speaks one message format (content blocks with text,
// tool_use and tool_result, the Anthropic shape); this worker translates it to Workers AI's
// chat + tools format and back, so the browser code doesn't care which model answers.
//
// Tool results go back to the model as plain text in a user turn. Workers AI's docs show how
// tools are declared and how calls come out, not how results go back in, and text is the
// format every instruction-tuned model handles.
//
// Bindings (wrangler.toml): AI (Workers AI), ALLOWED_ORIGIN (var)

const MODELS = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct-fp8"];  // big first, small if it fails
const LIMIT = 20;                 // requests per IP per 10 minutes
const hits = new Map();

const asText = blocks => typeof blocks === "string" ? blocks
  : blocks.map(b => b.type === "text" ? b.text
    : b.type === "tool_use" ? `[called ${b.name}(${JSON.stringify(b.input)})]`
    : b.type === "tool_result" ? `[result of ${b.tool_use_id}: ${b.content}]` : "").filter(Boolean).join("\n");

function toWorkersAI(body) {
  const messages = [{ role: "system", content: String(body.system || "").slice(0, 12000) }];
  for (const m of body.messages) {
    const results = Array.isArray(m.content) && m.content.some(b => b.type === "tool_result");
    messages.push({ role: m.role, content: (results ? "Tool results (the scene has already changed):\n" : "") + asText(m.content) });
  }
  const tools = (body.tools || []).map(t => ({ name: t.name, description: t.description, parameters: t.input_schema }));
  return { messages, tools, max_tokens: Math.min(Number(body.max_tokens) || 400, 600) };
}

function fromWorkersAI(out) {
  const content = [];
  if (out.response && String(out.response).trim()) content.push({ type: "text", text: String(out.response).trim() });
  (out.tool_calls || []).forEach((c, i) => {
    let input = c.arguments ?? {};
    if (typeof input === "string") { try { input = JSON.parse(input); } catch { input = {}; } }
    content.push({ type: "tool_use", id: `call_${Date.now()}_${i}`, name: c.name, input });
  });
  return { content };
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("origin") || "";
    const cors = { "access-control-allow-origin": env.ALLOWED_ORIGIN, "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST" || origin !== env.ALLOWED_ORIGIN) return new Response("forbidden", { status: 403, headers: cors });

    const ip = req.headers.get("cf-connecting-ip") || "?", now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < 600_000); recent.push(now); hits.set(ip, recent);
    if (recent.length > LIMIT) return Response.json({ error: "slow down" }, { status: 429, headers: cors });

    const body = await req.json();
    if (!Array.isArray(body.messages) || body.messages.length > 40 || JSON.stringify(body).length > 60000)
      return Response.json({ error: "request too large" }, { status: 413, headers: cors });

    const input = toWorkersAI(body);
    for (const model of MODELS) {
      try { return Response.json(fromWorkersAI(await env.AI.run(model, input)), { headers: cors }); }
      catch (e) { if (model === MODELS[MODELS.length - 1]) return Response.json({ error: String(e) }, { status: 502, headers: cors }); }
    }
  },
};
