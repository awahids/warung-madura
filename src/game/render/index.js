import { FONT, H, W } from '../constants.js';
import { ctx } from '../gfx.js';
import { active } from '../logic/customers.js';
import { drawDoor } from './door.js';
import { drawHUD } from './hud.js';
import { drawModals } from './modals.js';
import { drawBubble, drawScene } from './scene.js';
import { drawTitle } from './title.js';
import { G, fx, mouse, ui } from '../state.js';
import { T, clamp, inRect, rnd, rr } from '../util.js';

/* ---------- loop ---------- */
export function drawFloats() {
  for (const f of fx.floats) { const a = 1 - f.t / 1.4; ctx.globalAlpha = clamp(a * 1.6, 0, 1); T(f.s, f.x, f.y - f.t * 50, { s: 22, a: 'center', c: f.c, stroke: 'rgba(0,0,0,.7)', sw: 5 }); }
  ctx.globalAlpha = 1;
  fx.toasts.forEach((t, i) => {
    const a = t.t < .2 ? t.t / .2 : t.t > 3 ? (3.4 - t.t) / .4 : 1; ctx.globalAlpha = clamp(a, 0, 1);
    ctx.font = `700 16px ${FONT}`; const w = ctx.measureText(t.s).width + 40, ty = 580 - (fx.toasts.length - 1 - i) * 40;
    ctx.fillStyle = 'rgba(30,18,8,.88)'; rr(ctx, 640 - w / 2, ty - 24, w, 34, 17); ctx.fill();
    T(t.s, 640, ty - 1, { s: 16, a: 'center', c: t.c });
  });
  ctx.globalAlpha = 1;
}
export function drawTooltip() {
  if (!ui.tooltip || ui.modal) return; ctx.font = `700 14px ${FONT}`; const w = ctx.measureText(ui.tooltip).width + 22;
  let x = clamp(mouse.x + 16, 6, W - w - 6), y = clamp(mouse.y + 22, 62, H - 40);
  ctx.fillStyle = 'rgba(20,12,4,.92)'; rr(ctx, x, y, w, 30, 8); ctx.fill(); T(ui.tooltip, x + 11, y + 20, { s: 14, c: '#fff' });
}
export function draw() {
  ui.hits = []; ui.tooltip = '';
  ctx.clearRect(0, 0, W, H);
  if (G.screen === 'title') { drawTitle(); if (ui.modal === 'help') { ui.hits.length = 0; drawModals(); } }
  else {
    if (ui.shake > 0) { ctx.save(); ctx.translate(rnd(-ui.shake, ui.shake), rnd(-ui.shake, ui.shake)); }
    drawScene(); drawDoor();
    if (ui.shake > 0) ctx.restore();
    // vignette kewarasan
    if (G.energy < 25 && G.running) { const gg = ctx.createRadialGradient(640, 380, 250, 640, 380, 760); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, `rgba(0,0,0,${(25 - G.energy) / 25 * .6})`); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); }
    // bubble pelanggan aktif
    const c = active(); if (c && !ui.modal) drawBubble(c);
    drawFloats(); drawHUD(); drawTooltip();
    drawModals();
  }
  ui.cv.style.cursor = (ui.hits.length && ui.hits.some(h => inRect(mouse.x, mouse.y, h.x, h.y, h.w, h.h))) ? 'pointer' : 'default';
}
