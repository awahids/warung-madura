import { BILLS } from '../data.js';
import { ctx } from '../gfx.js';
import { ico } from '../icons.js';
import { kasbonLimit, outstanding } from '../logic/kasbon.js';
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
    const tc = ui.touch;
    button(x + w - 150, y + (tc ? 8 : 14), 134, tc ? 46 : 38, 'HITUNG', doHitung, { col: ok ? 'green' : 'wood', s: 18 });
    if (shortfall(c)) button(x + w - 150, y + (tc ? 58 : 58), 134, tc ? 40 : 34, 'MAAF, HABIS', doHabis, { col: 'red', s: tc ? 14 : 13 });
  } else if (c.stage === 'kasbon') {
    T(`Kasbon ${rp(c.total)}?`, x + 20, y + 40, { s: 20, c: '#3a210c' });
    T(`Dicatat di buku (beredar ${rp(outstanding())} / batas ${rp(kasbonLimit())}).`, x + 20, y + 64, { s: 12, c: outstanding() + c.total > kasbonLimit() ? '#c0392b' : '#5a3a1a' });
    button(x + w - 250, y + 28, 110, 44, 'BOLEH', () => doKasbon(true), { col: 'green' });
    button(x + w - 130, y + 28, 110, 44, 'TIDAK', () => doKasbon(false), { col: 'red' });
  } else if (c.stage === 'pay') {
    T(`Kembali: ${rp(c.change)}`, x + 18, y + 30, { s: 15, c: '#3a210c' });
    T(`Diberi: ${rp(c.given)}`, x + 18, y + 50, { s: 15, c: c.given > c.change ? '#c0392b' : c.given === c.change ? '#2a8a2a' : '#3a210c' });
    if (ui.touch) drawTouchBills(c); else BILLS.forEach((b, i) => {
      const bx = x + 14 + i * 60, by = y + 58, bw = 54, bh = 36;
      const hv = inRect(mouse.x, mouse.y, bx, by, bw, bh);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(ctx, bx, by + 3, bw, bh, 6); ctx.fill();
      ctx.fillStyle = b.c; rr(ctx, bx, by + (hv && mouse.down ? 2 : 0), bw, bh, 6); ctx.fill();
      ctx.lineWidth = hv ? 3 : 2; ctx.strokeStyle = hv ? '#fff' : 'rgba(0,0,0,.5)'; ctx.stroke();
      T(b.l, bx + bw / 2, by + 24, { s: 16, a: 'center', c: '#fff', stroke: 'rgba(0,0,0,.5)', sw: 3 });
      hit(bx, by, bw, bh, () => giveBill(b.v, c), 'Beri ' + rp(b.v));
    });
    const th = ui.touch ? 44 : 34;
    button(x + w - 130, y + (ui.touch ? 8 : 14), 112, th, 'BERI', confirmChange, { col: c.given >= c.change ? 'green' : 'wood', s: 17, disabled: c.given < c.change });
    button(x + w - 130, y + (ui.touch ? 56 : 56), 112, th, 'ULANG', () => { c.given = 0; }, { col: 'blue', s: 15 });
    const missing = c.change - c.given;
    if (missing > 0 && missing < 1e9) T(`kurang ${rp(missing)}`, x + 255, y + 50, { s: 12, c: '#7a3a1a' });
  }
}


/** Layar sentuh: pecahan uang besar dalam panel terpisah di atas rak (rak tak dipakai saat membayar). */
function drawTouchBills(c) {
  const px = 350, py = 512, pw = 500, ph = 84;
  ctx.fillStyle = 'rgba(40,20,6,.94)'; rr(ctx, px, py, pw, ph, 14); ctx.fill();
  ctx.strokeStyle = '#d9a55f'; ctx.lineWidth = 3; ctx.stroke();
  T('Ketuk uang untuk memberi kembalian', px + pw / 2, py + 17, { s: 12, a: 'center', c: '#f3d9a4' });
  BILLS.forEach((b, i) => {
    const bw = 74, bh = 52, bx = px + 8 + i * (bw + 8), by = py + 24;
    const pr = mouse.down && inRect(mouse.x, mouse.y, bx, by, bw, bh);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, bx, by + 3, bw, bh, 8); ctx.fill();
    ctx.fillStyle = b.c; rr(ctx, bx, by + (pr ? 2 : 0), bw, bh, 8); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = pr ? '#fff' : 'rgba(0,0,0,.5)'; ctx.stroke();
    T(b.l, bx + bw / 2, by + 33, { s: 21, a: 'center', c: '#fff', stroke: 'rgba(0,0,0,.5)', sw: 3 });
    hit(bx, by, bw, bh, () => giveBill(b.v, c), 'Beri ' + rp(b.v));
  });
}
