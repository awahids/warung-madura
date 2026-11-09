import { G } from './state.js';

/* ---------- audio (WebAudio, tanpa file) ---------- */
export let AC = null;
export function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
export function tone(f, d = .1, type = 'sine', v = .06, delay = 0, slide = 0) {
  if (!G.sound) return; const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.linearRampToValueAtTime(f + slide, t0 + d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + .03);
}
export function noise(d = .5, v = .05, f = 600) {
  if (!G.sound) return; const a = audio(); if (!a) return;
  const n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  fl.type = 'lowpass'; fl.frequency.value = f; g.gain.value = v; s.buffer = b; s.connect(fl); fl.connect(g); g.connect(a.destination); s.start();
}
export const SFX = {
  click: () => tone(540, .06, 'square', .03),
  add: () => tone(700, .07, 'triangle', .07, 0, 200),
  rem: () => tone(420, .07, 'triangle', .06, 0, -120),
  coin: () => { tone(988, .09, 'square', .04); tone(1319, .2, 'square', .04, .08); },
  err: () => tone(150, .25, 'sawtooth', .05),
  bell: () => { tone(880, .5, 'sine', .07); tone(1320, .5, 'sine', .035, .02); },
  door: () => noise(.6, .09, 500),
  good: () => { tone(523, .1, 'triangle', .06); tone(659, .1, 'triangle', .06, .1); tone(784, .2, 'triangle', .06, .2); },
  chirp: () => { tone(4200, .05, 'sine', .012); tone(4400, .05, 'sine', .012, .08); tone(4200, .05, 'sine', .012, .16); },
  phone: () => tone(1200, .04, 'square', .02),
  gulp: () => { tone(300, .1, 'sine', .08, 0, -80); tone(260, .1, 'sine', .08, .14, -80); },
};
