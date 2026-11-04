# Guide proxy (Cloudflare Worker)

GitHub Pages can't hold a secret, so the LLM guide talks to this tiny proxy.

```bash
npm i -g wrangler
cd worker
wrangler login
wrangler secret put ANTHROPIC_API_KEY          # paste your key
wrangler deploy                                 # prints https://ananta-guide.<you>.workers.dev
```

Then set `GUIDE_URL` in `js/config.js` to that URL and `ALLOWED_ORIGIN` in `wrangler.toml`
to your site's origin (e.g. `https://<you>.github.io`). Without a proxy the guide still
runs in offline mode, parsing common requests in the browser.
