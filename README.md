# Ananta · अनन्त

Interactive chambers that turn results from Indian mathematics into light and sound,
plus my IllustrisTNG research write-up. Live site: `https://ishamainii.github.io/ananta/`

| # | Chamber | Math | Status |
|---|---------|------|--------|
| 01 | Chandas | Pingala's meters as an n-cube, Meru Prastara face counts, Gray-code walk | live |
| 02 | Mādhava | Kerala series for π, the three end-corrections, the series around the unit circle | live |
| 03 | Chakravāla | the cyclic method for x² − Ny² = 1, exact BigInt arithmetic | live |
| 04 | Ramanujan | p(n) by Euler's recurrence, Hardy–Ramanujan asymptotics, domain colouring of ∏ 1/(1 − qᵏ) | live |
| 05 | Śrī Yantra | 11 concurrency equations in 16 unknowns, solved live by damped Newton | live |
| 06 | Tātkālika | Bhāskara II's instantaneous motion; gradient ascent to the extremum | live |
| 07 | Pūrṇa | Droste self-similarity, Jaina orders of number, khahara | live |

Every chamber has a guide (✦ ask): type "show me 6 dimensions", "solve N = 991",
"dive toward 1/5", "scramble it"… With a proxy configured (worker/README.md) it's an
LLM that drives the scene through tool calls; without one it parses requests offline.

## Layout
```
index.html                 home: chambers, research, lab log
chambers/<name>/           one folder per chamber (index.html + main.js)
research/illustristng/     research write-up
js/psyche.js               the kaleidoscope / log-polar zoom shader behind every chamber
js/sound.js                Web Audio score: Karplus–Strong tanpura & santoor, bansuri, bowl
js/chamber-ui.js           veil, dock, trip slider, notebook drawer, bibliography
data/sources.json          every citation, checked against a publisher or journal record
python/                    the math, tested first (pytest), then ported to JS
tools/make_pages.py        builds each chamber's index.html from tools/chamber.html + page.json + notes.html
worker/                    Cloudflare Worker proxy for the LLM guide
js/guide.js                the guide: tool-calling loop (online) or request parsing (offline)
```

## Run locally
```bash
python -m http.server 8000      # then open http://localhost:8000
cd python && python -m pytest   # 102 tests
node chambers/chakravala/wheel.test.mjs && node chambers/sriyantra/yantra.test.mjs
python tools/make_pages.py      # after editing a chamber's page.json or notes.html
```
No build step: plain ES modules, three.js r160 from a CDN via an import map.

## Deploy
Push to GitHub, then Settings → Pages → deploy from branch `main`, folder `/ (root)`.
