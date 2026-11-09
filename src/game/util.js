import { FONT } from './constants.js';
import { ctx } from './gfx.js';

/* ---------- util ---------- */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const rp = n => 'Rp ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const inRect = (px, py, x, y, w, h) => px >= x && px <= x + w && py >= y && py <= y + h;
export function wpick(map) {
  const e = Object.entries(map); let t = e.reduce((s, x) => s + x[1], 0), r = Math.random() * t;
  for (const [k, v] of e) { if ((r -= v) <= 0) return k; } return e[0][0];
}
export function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function T(s, x, y, o = {}) {
  ctx.font = `${o.w || '700'} ${o.s || 16}px ${FONT}`;
  ctx.textAlign = o.a || 'left'; ctx.textBaseline = o.b || 'alphabetic';
  if (o.stroke) { ctx.lineWidth = o.sw || 4; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = o.c || '#fff'; ctx.fillText(s, x, y);
}
export function wrapText(s, maxW, size, w = '700') {
  ctx.font = `${w} ${size}px ${FONT}`;
  const words = s.split(' '), lines = []; let cur = '';
  for (const wd of words) {
    const t = cur ? cur + ' ' + wd : wd;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t;
  }
  if (cur) lines.push(cur); return lines;
}
