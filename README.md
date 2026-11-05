# Ananta · अनन्त

Interactive chambers that turn results from Indian mathematics into light and sound, Live site: `https://ishamainii.github.io/ananta/`

| # | Chamber | Math | Status |
|---|---------|------|--------|
| 01 | Chandas | Pingala's meters as an n-cube, Meru Prastara face counts, Gray-code walk | live |
| 02 | Mādhava | Kerala series for π, the three end-corrections, the series around the unit circle | live |
| 03 | Chakravāla | the cyclic method for x² − Ny² = 1, exact BigInt arithmetic | live |
| 04 | Ramanujan | p(n) by Euler's recurrence, Hardy–Ramanujan asymptotics, domain colouring of ∏ 1/(1 − qᵏ) | live |
| 05 | Śrī Yantra | 11 concurrency equations in 16 unknowns, solved live by damped Newton | live |
| 06 | Tātkālika | Bhāskara II's instantaneous motion; gradient ascent to the extremum | live |
| 07 | Pūrṇa | Droste self-similarity, Jaina orders of number, khahara | live |

Every chamber teaches itself: a step-by-step "how to play" tour (each step changes the
scene), a colour key, and a "why this sound" panel that shows which number picked each note.

The guide (✦ ask, or g) has two modes. With GUIDE_URL set in js/config.js it is Claude,
reached through the proxy in worker/ (key kept server-side, origin-locked, rate-limited):
it gets the chamber's notes and live readout, calls the chamber's tools on the real scene,
reads the results and explains them. Without a proxy, or if the call fails, it falls back
to a command interpreter, also in js/guide.js. It splits a request into clauses ("show 6 dimensions and turn syllables 2 and 5,
then what is a guru"), sends each clause to the chamber's tools, and answers questions
from a keyword-matched question bank in each chamber's page.json. Voice in and out where
the browser supports it.

## Layout
```
index.html                 home: chambers, how to play, lab log
chambers/<name>/           one folder per chamber (index.html + main.js)
js/psyche.js               the kaleidoscope / log-polar zoom shader behind every chamber
js/sound.js                Web Audio score: Karplus–Strong tanpura & santoor, bansuri, bowl
js/chamber-ui.js           veil, dock, trip slider, notebook drawer, bibliography
data/sources.json          every citation, checked against a publisher or journal record
python/                    the math, tested first (pytest), then ported to JS
worker/                    Cloudflare Worker proxy for the AI guide
tools/make_pages.py        builds each chamber's index.html from tools/chamber.html + page.json + notes.html
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
