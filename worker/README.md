# Guide proxy (Cloudflare Worker + Workers AI)

GitHub Pages can't run a model or hold a secret, so the AI guide talks to this worker.
It runs Llama 3.3 70B on Cloudflare Workers AI, whose free allocation (10,000 neurons a
day) covers roughly 50 guide questions a day at this prompt size. No API key, no payment.
Past the daily allocation, or if the worker is down, the site's coded guide answers instead.

```bash
npm i -g wrangler
cd worker
wrangler login        # free Cloudflare account
wrangler deploy       # prints https://ananta-guide.<you>.workers.dev
```

Then set `GUIDE_URL` in `js/config.js` to that URL. `ALLOWED_ORIGIN` in `wrangler.toml`
locks the worker to the site's origin; it also rate-limits each visitor to 20 requests
per 10 minutes.
