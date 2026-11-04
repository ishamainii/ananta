// Cloudflare Worker: a thin proxy so the site can call the Anthropic API without
// exposing the key. It only allows requests from the site's origin, caps tokens,
// pins the model family, and rate-limits per IP.
//
// Secrets / vars (set with wrangler):  ANTHROPIC_API_KEY (secret), ALLOWED_ORIGIN (var)

const LIMIT = 30;                 // requests per IP per 10 minutes
const hits = new Map();

export default {
  async fetch(req, env) {
    const origin = req.headers.get("origin") || "";
    const cors = { "access-control-allow-origin": env.ALLOWED_ORIGIN, "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST" || origin !== env.ALLOWED_ORIGIN) return new Response("forbidden", { status: 403, headers: cors });

    const ip = req.headers.get("cf-connecting-ip") || "?", now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < 600_000); recent.push(now); hits.set(ip, recent);
    if (recent.length > LIMIT) return new Response(JSON.stringify({ error: "slow down" }), { status: 429, headers: cors });

    const body = await req.json();
    const payload = {
      model: String(body.model || "").startsWith("claude-") ? body.model : "claude-sonnet-5-5",
      max_tokens: Math.min(Number(body.max_tokens) || 400, 600),
      system: String(body.system || "").slice(0, 12000),
      tools: body.tools, messages: body.messages,
    };
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(payload),
    });
    return new Response(r.body, { status: r.status, headers: { ...cors, "content-type": "application/json" } });
  },
};
