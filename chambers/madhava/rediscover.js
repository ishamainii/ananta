// rediscover.js: can a machine find Mādhava's correction from data alone?
//
// Symbolic regression by exhaustive search. The data: for n = 5…40, the exact size of the
// tail Mādhava throws away,  R(n) = (−1)ⁿ (π/4 − Σ_{k<n} (−1)ᵏ/(2k+1)).
// The hypothesis space: every rational function
//     F(n) = (a n² + b n + c) / (d n³ + e n² + f n + g),   a…g whole numbers 0–6, d ≥ 1
// (703,836 formulas once the all-zero numerators are dropped). Score: the mean number of correct digits, −log₁₀|F(n) − R(n)|,
// over the training range. Then the winner is checked on n = 41…200, which it never saw.
//
// The search knows nothing about π, Kerala or Mādhava. If his (n² + 1)/(n(4n² + 5)) comes
// out on top, that's the data choosing it. The space is bounded by me (degree ≤ 2 over 3,
// small coefficients), and Mādhava's formula lies inside it: this is rediscovery inside a
// hypothesis space, not discovery from nothing, and the panel says so.

const SRC = `
const tail = n => { let s = 0; for (let k = 0; k < n; k++) s += (k % 2 ? -1 : 1) / (2 * k + 1); return (n % 2 ? -1 : 1) * (Math.PI / 4 - s); };
const TRAIN = [], TEST = [];
for (let n = 5; n <= 40; n++) TRAIN.push([n, tail(n)]);
for (let n = 41; n <= 200; n++) TEST.push([n, tail(n)]);
const score = (c, data) => { let s = 0; for (const [n, r] of data) { const F = (c[0]*n*n + c[1]*n + c[2]) / (c[3]*n*n*n + c[4]*n*n + c[5]*n + c[6]); s += -Math.log10(Math.abs(F - r) + 1e-300); } return s / data.length; };
onmessage = () => {
  const K = 7, top = [], t0 = performance.now(); let seen = 0;
  const keep = (sc, c) => { if (top.length < 6 || sc > top[top.length - 1][0]) { top.push([sc, c.slice()]); top.sort((x, y) => y[0] - x[0]); top.length = Math.min(top.length, 6); } };
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (c[0] = 0; c[0] < K; c[0]++) {
    for (c[1] = 0; c[1] < K; c[1]++) for (c[2] = 0; c[2] < K; c[2]++) {
      if (!c[0] && !c[1] && !c[2]) continue;
      for (c[3] = 1; c[3] < K; c[3]++) for (c[4] = 0; c[4] < K; c[4]++) for (c[5] = 0; c[5] < K; c[5]++) for (c[6] = 0; c[6] < K; c[6]++) { keep(score(c, TRAIN), c); seen++; }
    }
    postMessage({ progress: (c[0] + 1) / K, seen, top: top.map(([s, q]) => ({ s, c: q })) });
  }
  postMessage({ done: true, seen, ms: performance.now() - t0, top: top.map(([s, q]) => ({ s, c: q, test: score(q, TEST) })) });
};`;

// Mādhava's second and third corrections, n/(4n²+1) and (n²+1)/(n(4n²+5)). A candidate "is" one of them
// if it is the same function: equal at a dozen points (n²/(4n³+n) is n/(4n²+1) written differently).
const MADHAVA = [n => n / (4 * n * n + 1), n => (n * n + 1) / (n * (4 * n * n + 5))];
const evalF = (c, n) => (c[0] * n * n + c[1] * n + c[2]) / (c[3] * n ** 3 + c[4] * n * n + c[5] * n + c[6]);
const poly = (c, deg) => c.map((x, i) => [x, deg - i]).filter(([x]) => x).map(([x, p]) => `${x === 1 && p ? "" : x}${p ? "n" + (p > 1 ? ["", "", "²", "³"][p] : "") : ""}`).join(" + ");
export const formula = c => `(${poly(c.slice(0, 3), 2)}) / (${poly(c.slice(3), 3)})`;
const isMadhava = c => MADHAVA.findIndex(m => [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37].every(n => Math.abs(evalF(c, n) / m(n) - 1) < 1e-12));

export function createRediscovery({ panel, onDone }) {
  let worker = null;
  function run() {
    worker?.terminate();
    worker = new Worker(URL.createObjectURL(new Blob([SRC], { type: "text/javascript" })));
    panel.querySelector(".lab-out").innerHTML = `<p class="dim">searching 703,836 formulas…</p><div class="bar"><i style="width:0"></i></div><ol class="board"></ol>`;
    const bar = panel.querySelector(".bar i"), board = panel.querySelector(".board");
    const row = (t, i) => {
      const m = isMadhava(t.c);
      return `<li class="${m >= 0 ? "hit" : ""}"><b>${t.s.toFixed(2)}</b> digits <code>${formula(t.c)}</code>${m === 1 ? " <em>= Mādhava's sharpest correction</em>" : m === 0 ? " <em>= Mādhava's second correction</em>" : ""}${t.test != null ? `<span class="dim"> · unseen n = 41–200: ${t.test.toFixed(2)} digits</span>` : ""}</li>`;
    };
    return new Promise(res => {
      worker.onmessage = ({ data }) => {
        if (!data.done) { bar.style.width = `${data.progress * 100}%`; board.innerHTML = data.top.map(row).join(""); return; }
        bar.style.width = "100%"; board.innerHTML = data.top.map(row).join("");
        const win = data.top[0], m = isMadhava(win.c);
        panel.querySelector(".lab-out p").innerHTML = `Searched <b>${data.seen.toLocaleString()}</b> formulas in ${(data.ms / 1000).toFixed(1)} s. ` +
          (m === 1 ? `The best fit is <b>exactly Mādhava's correction</b>, (n² + 1) / (n(4n² + 5)): ${win.s.toFixed(1)} correct digits on average, and ${win.test.toFixed(1)} on values of n it never saw (there the error is down near the limit of 64-bit floating point). The search was told nothing about π or Kerala.`
                   : `The best fit is ${formula(win.c)}.`);
        worker.terminate(); worker = null; onDone?.(data); res(data);
      };
      worker.postMessage(0);
    });
  }
  panel.querySelector(".lab-run").addEventListener("click", run);
  return { run };
}
