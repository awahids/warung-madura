import { ATLAS } from './atlas.js';
import { IMG, ctx } from './gfx.js';
import { G, mouse, ui } from './state.js';
import { T, inRect } from './util.js';

/* ---------- sprite helper ---------- */
export function canAct() { return !ui.modal && G.doorState === 'open' && G.screen === 'play'; }
export function hit(x, y, w, h, fn, tip) { ui.hits.push({ x, y, w, h, fn, tip }); }
export function SP(name, x, y, sc = 1, ax = 0, ay = 0, o = {}) {
  const a = ATLAS[name], w = a[2] * sc, h = a[3] * sc, dx = x - w * ax, dy = y - h * ay;
  const act = o.fn && (o.always || canAct());
  const hv = act && inRect(mouse.x, mouse.y, dx, dy, w, h);
  if (hv || o.glow) { ctx.save(); ctx.shadowColor = o.glowC || 'rgba(255,236,140,.95)'; ctx.shadowBlur = 24; }
  if (o.al !== undefined) ctx.globalAlpha = o.al;
  if (o.flip) { ctx.save(); ctx.translate(dx + w, dy); ctx.scale(-1, 1); ctx.drawImage(IMG, a[0], a[1], a[2], a[3], 0, 0, w, h); ctx.restore(); }
  else ctx.drawImage(IMG, a[0], a[1], a[2], a[3], dx, dy, w, h);
  ctx.globalAlpha = 1;
  if (hv || o.glow) ctx.restore();
  if (act) { const pad = o.pad ?? (ui.touch ? 6 : 0); hit(dx - pad, dy - pad, w + 2 * pad, h + 2 * pad, o.fn, o.tip); if (hv && o.tip) ui.tooltip = o.tip; }
  return { x: dx, y: dy, w, h, hv };
}
export function badge(r, n) {
  const x = r.x + r.w - 6, y = r.y + 8;
  ctx.fillStyle = n === 0 ? '#d62f2f' : n <= 2 ? '#e08a1c' : '#3b2412';
  ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
  T(String(n), x, y + 6, { s: 18, a: 'center', c: '#fff' });
}

