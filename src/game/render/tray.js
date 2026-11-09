import { BILLS } from '../data.js';
import { ctx } from '../gfx.js';
import { ico } from '../icons.js';
import { active, confirmChange, doHabis, doHitung, doKasbon, giveBill, removeFromTray, shortfall, trayMatches } from '../logic/customers.js';
import { hit } from '../sprites.js';
import { G, mouse, ui } from '../state.js';
import { T, inRect, rp, rr } from '../util.js';
import { button } from '../widgets.js';

export function drawTray() {
  const x = 350, y = 610, w = 500, h = 104;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, x + 3, y + 6, w, h, 14); ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#8a5424'); g.addColorStop(1, '#5e3513');
  ctx.fillStyle = g; rr(ctx, x, y, w, h, 14); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#3a210c'; ctx.stroke();
  ctx.fillStyle = '#d8a15d'; rr(ctx, x + 8, y + 8, w - 16, h - 16, 10); ctx.fill();
  const c = active();
  if (!G.running) { T('Warung belum buka.', x + w / 2, y + h / 2 + 5, { s: 16, a: 'center', c: '#5a3a1a' }); return; }
  if (!c) {
    T('Menunggu pembeli…', x + w / 2, y + 44, { s: 18, a: 'center', c: '#5a3a1a' });
    T('Klik barang yang diminta pembeli → HITUNG → beri kembalian', x + w / 2, y + 70, { s: 12, a: 'center', c: '#7a5a3a' });
    return;
  }
  if (c.stage === 'order') {
    // isi nampan
    const ids = Object.keys(G.tray); let ix = x + 18;
    if (!ids.length) T('Nampan kosong — klik barang di rak', x + 20, y + 56, { s: 14, c: '#7a5a3a' });
    ids.forEach(id => {
      const r = { x: ix, y: y + 16, w: 56, h: 72 };
      const hv = inRect(mouse.x, mouse.y, r.x, r.y, r.w, r.h);
      ctx.fillStyle = hv ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.3)'; rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
      ico(id, r.x + 4, r.y + 2, 48); T('x' + G.tray[id], r.x + r.w / 2, r.y + 66, { s: 15, a: 'center', c: '#3a210c' });
      hit(r.x, r.y, r.w, r.h, () => removeFromTray(id), 'Klik untuk kembalikan ke rak'); if (hv) ui.tooltip = 'Klik untuk kembalikan ke rak';
      ix += 62;
    });
    const ok = trayMatches(c);
    button(x + w - 150, y + 14, 134, 38, 'HITUNG', doHitung, { col: ok ? 'green' : 'wood', s: 18 });
    if (shortfall(c)) button(x + w - 150, y + 58, 134, 34, 'MAAF, HABIS', doHabis, { col: 'red', s: 13 });
  } else if (c.stage === 'kasbon') {
    T(`Kasbon ${rp(c.total)}?`, x + 20, y + 40, { s: 20, c: '#3a210c' });
    T('Dicatat di buku, dibayar besok (kadang macet).', x + 20, y + 64, { s: 12, c: '#5a3a1a' });
    button(x + w - 250, y + 28, 110, 44, 'BOLEH', () => doKasbon(true), { col: 'green' });
    button(x + w - 130, y + 28, 110, 44, 'TIDAK', () => doKasbon(false), { col: 'red' });
  } else if (c.stage === 'pay') {
    T(`Kembali: ${rp(c.change)}`, x + 18, y + 30, { s: 15, c: '#3a210c' });
    T(`Diberi: ${rp(c.given)}`, x + 18, y + 50, { s: 15, c: c.given > c.change ? '#c0392b' : c.given === c.change ? '#2a8a2a' : '#3a210c' });
    BILLS.forEach((b, i) => {
      const bx = x + 14 + i * 60, by = y + 58, bw = 54, bh = 36;
      const hv = inRect(mouse.x, mouse.y, bx, by, bw, bh);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(ctx, bx, by + 3, bw, bh, 6); ctx.fill();
      ctx.fillStyle = b.c; rr(ctx, bx, by + (hv && mouse.down ? 2 : 0), bw, bh, 6); ctx.fill();
      ctx.lineWidth = hv ? 3 : 2; ctx.strokeStyle = hv ? '#fff' : 'rgba(0,0,0,.5)'; ctx.stroke();
      T(b.l, bx + bw / 2, by + 24, { s: 16, a: 'center', c: '#fff', stroke: 'rgba(0,0,0,.5)', sw: 3 });
      hit(bx, by, bw, bh, () => giveBill(b.v, c), 'Beri ' + rp(b.v));
    });
    button(x + w - 130, y + 14, 112, 34, 'BERI', confirmChange, { col: c.given >= c.change ? 'green' : 'wood', s: 17, disabled: c.given < c.change });
    button(x + w - 130, y + 56, 112, 34, 'ULANG', () => { c.given = 0; }, { col: 'blue', s: 15 });
    const missing = c.change - c.given;
    if (missing > 0 && missing < 1e9) T(`kurang ${rp(missing)}`, x + 255, y + 50, { s: 12, c: '#7a3a1a' });
  }
}

