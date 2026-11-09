import { W } from '../constants.js';
import { ctx } from '../gfx.js';
import { isRain } from '../logic/day.js';
import { SP } from '../sprites.js';
import { G, fx } from '../state.js';
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
// kota latar belakang (statis)
export const SKYLINE = (() => {
  const a = []; let x = -20; let s = 7;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  while (x < W + 40) { const w = 70 + r() * 90, h = 70 + r() * 150; a.push({ x, w, h, c: Math.floor(r() * 3), wins: Math.floor(r() * 4) }); x += w + 4; }
  return a;
})();

export function drawBackground() {
  const h = G.screen === 'play' ? G.h : 12;
  const [top, bot] = skyAt(h);
  const g = ctx.createLinearGradient(0, 0, 0, 330); g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 340);
  // matahari / bulan
  if (h > 6 && h < 18.4) { const t = (h - 6) / 12.4, sx = lerp(120, 1160, t), sy = 250 - Math.sin(t * Math.PI) * 190; ctx.fillStyle = 'rgba(255,240,170,.9)'; ctx.beginPath(); ctx.arc(sx, sy, 34, 0, 7); ctx.fill(); }
  else { const hh = h < 12 ? h + 24 : h, t = clamp((hh - 18.4) / 10, 0, 1), sx = lerp(180, 1100, t), sy = 230 - Math.sin(t * Math.PI) * 150; ctx.fillStyle = '#f3f1d6'; ctx.beginPath(); ctx.arc(sx, sy, 26, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,30,.18)'; ctx.beginPath(); ctx.arc(sx - 7, sy - 3, 6, 0, 7); ctx.fill(); }
  // bintang
  const dk = darkness(h);
  if (dk > .3) { ctx.fillStyle = `rgba(255,255,230,${(dk - .3) * 1.4})`; for (let i = 0; i < 40; i++) { const x = (i * 197) % W, y = (i * 83) % 190; ctx.fillRect(x, y, 2, 2); } }
  // gedung
  SKYLINE.forEach(b => {
    ctx.fillStyle = ['#7a8a9c', '#8f7f78', '#6d7f74'][b.c]; ctx.fillRect(b.x, 330 - b.h, b.w, b.h);
    ctx.fillStyle = dk > .3 ? '#ffe9a0' : 'rgba(255,255,255,.35)';
    for (let yy = 330 - b.h + 14; yy < 316; yy += 26) for (let xx = b.x + 10; xx < b.x + b.w - 14; xx += 22) if (((xx * 7 + yy * 3 + b.wins) % 5) < 3) ctx.fillRect(xx, yy, 10, 12);
  });
  // jalan
  ctx.fillStyle = '#58595e'; ctx.fillRect(0, 330, W, 90);
  ctx.fillStyle = '#e8d9a0'; for (let x = 10; x < W; x += 110) ctx.fillRect(x, 372, 56, 5);
  ctx.fillStyle = '#9a9a94'; ctx.fillRect(0, 420, W, 300);
  ctx.fillStyle = '#b3b2aa'; ctx.fillRect(0, 418, W, 6);
  ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let x = 0; x < W; x += 80) ctx.fillRect(x, 424, 2, 296);
  // dekor
  SP('tree', 1180, 346, 1.25, .5, 1);
  SP('esteh', 545, 410, .62, .5, 1);
  SP('tong', 790, 424, .78, .5, 1);
  SP('cone', 715, 420, .5, .5, 1);
  // lalu lintas
  for (const t of fx.traffic) SP('motor', t.x, 396, .62, .5, 1, { flip: t.dir < 0 });
  // gelap malam
  if (dk > 0) { ctx.fillStyle = `rgba(6,10,40,${dk})`; ctx.fillRect(0, 0, W, 500); }
  // cahaya neon warung
  if (dk > .25) {
    const gl = ctx.createRadialGradient(640, 330, 20, 640, 400, 470); gl.addColorStop(0, `rgba(255,255,245,${dk * .55})`); gl.addColorStop(1, 'rgba(255,255,245,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 56, W, 520);
  }
  // hujan
  if (isRain()) {
    ctx.strokeStyle = 'rgba(200,220,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const d of fx.rainDrops) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 4, d.y + 16); } ctx.stroke();
  }
}

