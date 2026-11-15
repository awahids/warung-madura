import { isRain } from '../logic/day.js';
import { clamp, lerp } from '../util.js';

/* ============================================================
   RENDER
   ============================================================ */
export const SKY = [
  [5, '#2a3a6a', '#f2a65a'], [7, '#6fb3e8', '#fbe3b0'], [12, '#4aa3e8', '#bfe6ff'], [16, '#69b4e6', '#ffe0a3'],
  [18, '#e0765a', '#ffc27a'], [19.6, '#1d2a55', '#6a4c8c'], [21.5, '#0a1230', '#1a2550'], [27, '#0a1230', '#1a2550'],
];
export function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
export function skyAt(h) {
  let a = SKY[0], b = SKY[SKY.length - 1];
  for (let i = 0; i < SKY.length - 1; i++) if (h >= SKY[i][0] && h <= SKY[i + 1][0]) { a = SKY[i]; b = SKY[i + 1]; break; }
  const t = clamp((h - a[0]) / (b[0] - a[0] || 1), 0, 1);
  const mix = (c1, c2) => { const x = hex(c1), y = hex(c2); return `rgb(${Math.round(lerp(x[0], y[0], t))},${Math.round(lerp(x[1], y[1], t))},${Math.round(lerp(x[2], y[2], t))})`; };
  return [mix(a[1], b[1]), mix(a[2], b[2])];
}
export function darkness(h) {
  let d = 0;
  if (h < 7.5) d = lerp(.35, 0, clamp((h - 6) / 1.5, 0, 1));
  else if (h < 16.5) d = 0;
  else if (h < 19.6) d = lerp(0, .6, (h - 16.5) / 3.1);
  else d = .62;
  if (isRain()) d = Math.max(d, .22);
  return d;
}
