// sound.js — the shared score: tanpura, low drone, bansuri alaap, singing bowl, santoor.
// Everything is synthesised in the browser with the Web Audio API; no samples.
//
//  - tanpura + santoor: Karplus–Strong. A burst of noise circulates in a delay line
//    one period long, through a two-tap averaging filter; it settles into a string tone.
//    The tanpura adds a small nonlinearity in the loop for the buzz of its jawari bridge.
//  - bansuri: sine + triangle with breath noise, glides (meend) between notes, late vibrato.
//  - bowl: inharmonic partials (1, 2.71, 5.15, 8.4 x f), each a slightly detuned pair so it beats.
// Melody follows Raag Bhupali (Sa Re Ga Pa Dha), which has no dissonant intervals.

export const SA = 138.59;                         // Sa near C#3
const BHU = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
export const degree = (d, base = SA * 2) => base * BHU[((d % 5) + 5) % 5] * 2 ** Math.floor(d / 5);

// name a frequency as a swara of the scale: which degree, its ratio to Sa, and the octave
const SWARA = ["Sa", "Re", "Ga", "Pa", "Dha"], RATIO = ["1", "9/8", "5/4", "3/2", "5/3"];
export function swara(f) {
  const oct = Math.floor(Math.log2(f / SA) + 0.03), r = f / (SA * 2 ** oct);   // 0.03 octave of slack so a note a hair flat of Sa still counts as Sa
  let best = 0; BHU.forEach((b, i) => { if (Math.abs(Math.log2(r / b)) < Math.abs(Math.log2(r / BHU[best]))) best = i; });
  const off = Math.abs(1200 * Math.log2(r / BHU[best]));
  // the exact ratio to the home Sa, octave included: Ga two octaves up is 5/4 × 4 = 5
  const [n0, d0] = RATIO[best].split("/").map(Number).concat(1).slice(0, 2), g = (a, b) => b ? g(b, a % b) : a;
  let num = n0 * 2 ** Math.max(0, oct), den = d0 * 2 ** Math.max(0, -oct); const k = g(num, den); num /= k; den /= k;
  const frac = den === 1 ? `${num}` : `${num}/${den}`;
  return { name: SWARA[best], ratio: frac, octave: oct, inScale: off < 15, label: off < 15 ? `${SWARA[best]} = ${frac} × Sa` : `${Math.round(f)} Hz` };
}

export function createSound() {
  let vol = (() => { try { const v = parseFloat(localStorage.getItem("ananta-vol")); return isNaN(v) ? 0.5 : v; } catch { return 0.7; } })();
  let ac = null, master, wet, analyser, data, on = false, timer = null;
  let droneNext = 0, droneIdx = 0, fluteFree = 0, flute = null;
  const cache = new Map();

  function init() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    analyser = ac.createAnalyser(); analyser.fftSize = 512; data = new Uint8Array(analyser.fftSize);
    comp.connect(analyser); analyser.connect(ac.destination);
    master = ac.createGain(); master.gain.value = 0.0001; master.connect(comp);
    const len = Math.floor(ac.sampleRate * 5.5), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {           // a long hall whose tail gets darker as it decays
      const d = ir.getChannelData(ch); let lp = 0;
      for (let i = 0; i < len; i++) { const k = 0.25 + 0.7 * (i / len); lp = k * lp + (1 - k) * (Math.random() * 2 - 1); d[i] = lp * (1 - i / len) ** 2.4; }
    }
    const conv = ac.createConvolver(); conv.buffer = ir;
    wet = ac.createGain(); wet.gain.value = 0.7; wet.connect(conv); conv.connect(comp);
    pad(); flute = makeFlute();
  }
  function out(node, dry, send) {
    const g = ac.createGain(); g.gain.value = dry; node.connect(g); g.connect(master);
    if (send) { const s = ac.createGain(); s.gain.value = send; node.connect(s); s.connect(wet); }
  }
  function pad() {
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380; lp.Q.value = 0.8;
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.045; lg.gain.value = 160;
    lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    [[0.5, "sawtooth", .35, -6], [0.5, "sawtooth", .35, 7], [1, "sawtooth", .18, 0], [0.75, "sine", .25, 0], [0.5, "sine", .6, 0]].forEach(([m, t, g, det]) => {
      const o = ac.createOscillator(), gn = ac.createGain(); o.type = t; o.frequency.value = SA * m; o.detune.value = det; gn.gain.value = g;
      o.connect(gn); gn.connect(lp); o.start();
    });
    const pg = ac.createGain(); pg.gain.value = 0.05; lp.connect(pg); out(pg, 1, 0.6);
  }
  function ks(f, t60, bright, jawari = 0) {
    const key = `${f.toFixed(2)}|${t60}|${bright}|${jawari}`; if (cache.has(key)) return cache.get(key);
    const sr = ac.sampleRate, N = Math.max(2, Math.round(sr / f - 0.5));
    const L = Math.floor(sr * Math.min(t60 * 0.8, 7) + sr * 0.1), y = new Float32Array(L);
    const decay = 10 ** (-3 / (f * t60));      // loss per trip round the loop: -60 dB after t60 seconds
    let lp = 0, mean = 0;
    for (let i = 0; i < N; i++) { lp = bright * (Math.random() * 2 - 1) + (1 - bright) * lp; y[i] = lp; mean += lp; }
    mean /= N; for (let i = 0; i < N; i++) y[i] -= mean;
    for (let i = N; i < L; i++) {
      let v = decay * 0.5 * (y[i - N] + (i - N - 1 >= 0 ? y[i - N - 1] : 0));
      if (jawari) v = Math.max(-1, Math.min(1, v + jawari * v * Math.abs(v)));
      y[i] = v;
    }
    let pk = 1e-6; for (let i = 0; i < Math.min(L, N * 6); i++) pk = Math.max(pk, Math.abs(y[i]));
    const buf = ac.createBuffer(1, L, sr), d = buf.getChannelData(0); for (let i = 0; i < L; i++) d[i] = y[i] * 0.8 / pk;
    cache.set(key, buf); return buf;
  }
  function play(buf, t, gain, rate = 1, send = 0.5) {
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = buf; src.playbackRate.value = rate; g.gain.value = gain;
    src.connect(g); out(g, 1, send); src.start(t);
  }
  function droneTick() {
    const strings = [SA * 0.75, SA, SA, SA / 2];   // Pa, Sa, Sa, low Sa
    while (droneNext < ac.currentTime + 1.6) { play(ks(strings[droneIdx % 4], 9, 0.4, 0.18), droneNext, 0.085, 1, 0.6); droneIdx++; droneNext += 1.45; }
  }
  function makeFlute() {
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(); o1.type = "sine"; o2.type = "triangle";
    const g2 = ac.createGain(); g2.gain.value = 0.16;
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.1; vg.gain.value = 0;
    vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
    const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource(); noise.buffer = nb; noise.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 3;
    const bg = ac.createGain(); bg.gain.value = 0; const amp = ac.createGain(); amp.gain.value = 0.0001;
    const tone = ac.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 1700;
    o1.connect(amp); o2.connect(g2); g2.connect(amp); noise.connect(bp); bp.connect(bg); bg.connect(amp); amp.connect(tone); out(tone, 0.9, 0.75);
    [o1, o2, vib, noise].forEach(x => x.start());
    return { o1, o2, bp, bg, vg, amp, f: 0, d: 2 };
  }
  function fluteNote(t, f, dur, first) {
    const F = flute, glide = first ? 0 : (Math.abs(Math.log2(f / F.f)) > 0.2 ? 0.42 : 0.14);
    for (const p of [F.o1.frequency, F.o2.frequency, F.bp.frequency]) {
      p.cancelScheduledValues(t);
      if (first || !F.f) p.setValueAtTime(f, t); else { p.setValueAtTime(F.f, t); p.exponentialRampToValueAtTime(f, t + glide); }
    }
    if (first) { F.amp.gain.setValueAtTime(0.0001, t); F.amp.gain.exponentialRampToValueAtTime(0.065, t + 0.5); }
    else F.amp.gain.linearRampToValueAtTime(0.05 + 0.02 * Math.random(), t + glide + 0.35);
    F.bg.gain.setValueAtTime(first ? 0.025 : 0.012, t); F.bg.gain.linearRampToValueAtTime(0.008, t + 0.4);
    F.vg.gain.setValueAtTime(0, t + glide); F.vg.gain.linearRampToValueAtTime(dur > 1.2 ? f * 0.007 : 0, t + glide + Math.min(1.1, dur * 0.6));
    F.f = f;
  }
  function phrase() {                            // one alaap phrase: mostly stepwise, resting on Sa, Ga or Pa
    let t = Math.max(fluteFree, ac.currentTime + 0.1), d = flute.d;
    const len = 3 + Math.floor(Math.random() * 4);
    for (let k = 0; k < len; k++) {
      const last = k === len - 1;
      if (k > 0) { const mv = [-2, -1, -1, -1, 1, 1, 1, 2]; d += mv[Math.floor(Math.random() * mv.length)]; }
      d = Math.max(-1, Math.min(6, d));
      if (last) d = [0, 2, 3, 5, 7].reduce((a, b) => Math.abs(b - d) < Math.abs(a - d) ? b : a);
      const dur = last ? 2.6 + Math.random() * 1.6 : 0.7 + Math.random() * 0.9;
      fluteNote(t, degree(d), dur, k === 0); t += dur;
    }
    flute.amp.gain.setValueAtTime(0.05, t); flute.amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    flute.bg.gain.linearRampToValueAtTime(0, t + 0.6); flute.vg.gain.linearRampToValueAtTime(0, t + 0.5);
    flute.d = d; fluteFree = t + 2.8 + Math.random() * 3.5;
  }
  function tick() { droneTick(); if (ac.currentTime + 1.5 > fluteFree) phrase(); }

  const api = {
    get on() { return on; },
    async start() {
      if (!ac) init();
      await ac.resume(); on = true;
      droneNext = Math.max(droneNext, ac.currentTime + 0.05); fluteFree = Math.max(fluteFree, ac.currentTime + 3);
      master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ac.currentTime);
      master.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * 1.2), ac.currentTime + 3);
      tick(); clearInterval(timer); timer = setInterval(tick, 200); api.bowl();
    },
    stop() {
      on = false; clearInterval(timer); if (!ac) return;
      master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ac.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.8);
      setTimeout(() => { if (!on) ac.suspend(); }, 900);
    },
    get volume() { return vol; },
    setVolume(v) {                                // 0..1, remembered between visits
      vol = Math.max(0, Math.min(1, v)); try { localStorage.setItem("ananta-vol", String(vol)); } catch {}
      if (ac && on) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(Math.max(0.0001, vol * 1.2), ac.currentTime, 0.08); }
    },
    onNote: null,                                 // the chamber UI listens here to explain each note
    why: "",                                      // the chamber sets this before each note: which number chose it
    bowl(f = SA * 2) {
      if (!on) return; api.onNote?.({ kind: "bowl", f, why: api.why }); const t = ac.currentTime + 0.03;
      // partials of a struck bowl. the upper ones are kept quiet and short so it rings warm, not shrill
      [[1, 1, 11], [2.71, .22, 6], [5.15, .06, 3]].forEach(([m, a, dcy]) => [0, 0.9].forEach(det => {
        const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = f * m + det;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03 * a, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + dcy);
        o.connect(g); out(g, 1, 0.75); o.start(t); o.stop(t + dcy + 0.1);
      }));
    },
    pluck(f, gain = 0.07) {                       // a soft santoor string, two courses slightly apart in tune
      if (!on) return; api.onNote?.({ kind: "santoor", f, why: api.why });
      // dark, soft strike, and quieter the higher it goes, so fast passages never get piercing
      const t = ac.currentTime + 0.02, b = ks(f, 2.2, 0.32), g = gain * 0.75 * Math.min(1, Math.sqrt(330 / f));
      play(b, t, g, 1.002, 0.8); play(b, t + 0.012, g * 0.6, 0.998, 0.8);
    },
    energy() {                                    // 0..1 loudness, for the visuals to breathe with
      if (!on || !analyser) return 0;
      analyser.getByteTimeDomainData(data); let s = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; s += v * v; }
      return Math.min(1, Math.sqrt(s / data.length) * 6);
    },
  };
  return api;
}
