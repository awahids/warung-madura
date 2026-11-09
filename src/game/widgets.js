import { SFX } from './audio.js';
import { ctx } from './gfx.js';
import { hit } from './sprites.js';
import { fx, mouse, ui } from './state.js';
import { T, inRect, rr } from './util.js';

/* ---------- UI helpers ---------- */
export const COL = {
  green: ['#58d658', '#2e9a36'], red: ['#ee5a4a', '#b3281e'], wood: ['#c98a4b', '#8a5424'],
  blue: ['#5aa6ee', '#2d68b3'], yellow: ['#ffd84a', '#d99a14'], grey: ['#9aa0a6', '#666d73'],
};
export function button(x, y, w, h, label, fn, o = {}) {
  const dis = o.disabled, hv = !dis && inRect(mouse.x, mouse.y, x, y, w, h), pr = hv && mouse.down;
  const c = dis ? COL.grey : COL[o.col || 'green'];
  ctx.save(); ctx.translate(0, pr ? 2 : 0);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, x, y + 4, w, h, 10); ctx.fill();
  const gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, hv ? '#fff' : c[0]); gr.addColorStop(hv ? .15 : 0, c[0]); gr.addColorStop(1, c[1]);
  ctx.fillStyle = gr; rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; rr(ctx, x + 4, y + 3, w - 8, h * .36, 7); ctx.fill();
  T(label, x + w / 2, y + h / 2 + (o.s || 18) * .34, { s: o.s || 18, a: 'center', c: dis ? '#d6d6d6' : (o.tc || '#fff'), stroke: 'rgba(0,0,0,.45)', sw: 3 });
  ctx.restore();
  if (!dis) { hit(x, y, w, h, () => { SFX.click(); fn(); }, o.tip); if (hv && o.tip) ui.tooltip = o.tip; }
}
export function panel(x, y, w, h, o = {}) {
  ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(ctx, x + 4, y + 8, w, h, 16); ctx.fill();
  ctx.fillStyle = o.border || '#6b4020'; rr(ctx, x, y, w, h, 16); ctx.fill();
  ctx.fillStyle = o.fill || '#f6e7c1'; rr(ctx, x + 6, y + 6, w - 12, h - 12, 12); ctx.fill();
}
export function toast(s, color = '#fff') { fx.toasts.push({ s, t: 0, c: color }); if (fx.toasts.length > 4) fx.toasts.shift(); }
export function flt(s, x, y, c = '#ffe45c') { fx.floats.push({ s, x, y, t: 0, c }); }
