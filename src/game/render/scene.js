import { FONT } from '../constants.js';
import { BY } from '../data.js';
import { ctx } from '../gfx.js';
import { ico } from '../icons.js';
import { SP } from '../sprites.js';
import { G, mouse, ui } from '../state.js';
import { regTier } from '../logic/regulars.js';
import { T, clamp, rp, rr, wrapText } from '../util.js';

/** Ukuran balon pesanan. compact: versi ringkas untuk mode 3D (tidak menutupi banyak barang). */
export function bubbleSize(c, compact = false) {
  const w = compact ? 232 : 296, lines = c.order.length, isPay = c.stage === 'pay';
  const nSay = compact ? Math.min(2, ctx ? wrapText(c.say, w - 28, 13, '600').length : Math.ceil((c.say || '').length / 29) || 1) : wrapText(c.say, w - 28, 14, '600').length;
  const rowH = compact ? 30 : 36, hh = (compact ? 34 : 40) + nSay * (compact ? 17 : 18) + lines * rowH + (isPay ? (compact ? 50 : 62) : 0) + (compact ? 18 : 22);
  return { w, hh };
}

/**
 * Balon pesanan. at = {x, y} pojok kiri-atas; opts.compact = ringkas; opts.tail = {x, y} titik yang ditunjuk ekor (mis. kepala pelanggan);
 * memudar bila kursor berada di atasnya agar barang di belakangnya tetap terlihat/terklik.
 */
export function drawBubble(c, at, opts = {}) {
  const compact = !!opts.compact, { w, hh } = bubbleSize(c, compact), x = at ? at.x : 722, y = at ? at.y : 128, isPay = c.stage === 'pay';
  const hover = mouse.x >= x - 20 && mouse.x <= x + w + 20 && mouse.y >= y - 10 && mouse.y <= y + hh + 10;
  ui.bubbleFade = (ui.bubbleFade ?? 1) + ((hover ? .28 : 1) - (ui.bubbleFade ?? 1)) * .25;
  ctx.save(); ctx.globalAlpha = ui.bubbleFade;
  const rowH = compact ? 30 : 36, rowIn = compact ? 26 : 32, icoS = compact ? 26 : 34, fs = compact ? 14 : 15;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, x + 3, y + 6, w, hh, 14); ctx.fill();
  ctx.fillStyle = '#fffaf0'; rr(ctx, x, y, w, hh, 14); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#5a3a1a'; ctx.stroke();
  // ekor
  const tl = opts.tail;
  if (tl) {
    const side = tl.x < x ? 'l' : tl.x > x + w ? 'r' : tl.y < y ? 't' : 'b';
    const ex = side === 'l' ? x : side === 'r' ? x + w : clamp(tl.x, x + 24, x + w - 24), ey = side === 't' ? y : side === 'b' ? y + hh : clamp(tl.y, y + 24, y + hh - 24);
    const dx = side === 'l' ? -16 : side === 'r' ? 16 : 0, dy = side === 't' ? -16 : side === 'b' ? 16 : 0, px = dy ? 9 : 0, py = dx ? 9 : 0;
    ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#5a3a1a'; ctx.beginPath(); ctx.moveTo(ex - px, ey - py); ctx.lineTo(ex + dx, ey + dy); ctx.lineTo(ex + px, ey + py); ctx.stroke(); ctx.fill();
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(ex - (dy ? 8 : 2) , ey - (dx ? 8 : 2), dy ? 16 : 4, dx ? 16 : 4);
  } else {
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(x, y + 60); ctx.lineTo(x - 18, y + 76); ctx.lineTo(x, y + 84); ctx.fill();
    ctx.strokeStyle = '#5a3a1a'; ctx.beginPath(); ctx.moveTo(x, y + 58); ctx.lineTo(x - 18, y + 76); ctx.lineTo(x, y + 86); ctx.stroke();
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(x - 1, y + 61, 3, 22);
  }
  let cy = y + (compact ? 21 : 24);
  T(c.name + (c.reg ? ' ' + '★'.repeat(regTier(c.reg)) : '') + (c.event === 'kasbon' ? '  · KASBON' : ''), x + 14, cy, { s: compact ? 14 : 15, c: c.event === 'kasbon' ? '#c0392b' : '#8a5424' }); cy += 6;
  const sayAll = wrapText(c.say, w - 28, compact ? 13 : 14, '600'), sayL = compact ? (sayAll.length > 2 ? [sayAll[0], sayAll[1] + '…'] : sayAll) : sayAll;
  sayL.forEach(l => { cy += compact ? 17 : 18; T(l, x + 14, cy, { s: compact ? 13 : 14, w: '600', c: '#3a2a1a' }); });
  cy += compact ? 7 : 10;
  for (const l of c.order) {
    const have = G.tray[l.id] || 0, ok = have === l.qty, over = have > l.qty;
    ctx.fillStyle = ok ? '#dff5d2' : over ? '#fbdada' : '#f4ead2'; rr(ctx, x + 10, cy, w - 20, rowIn, 8); ctx.fill();
    ico(l.id, x + 14, cy + (rowIn - icoS) / 2, icoS);
    { const maxW = w - 14 - icoS - 6 - (compact ? 62 : 70); let f = fs; ctx.font = `700 ${f}px ${FONT}`; while (f > 10 && ctx.measureText(BY[l.id].name).width > maxW) { f -= .5; ctx.font = `700 ${f}px ${FONT}`; }
      T(BY[l.id].name, x + 14 + icoS + 6, cy + rowIn / 2 + 5, { s: f, c: '#3a2a1a' }); }
    T(`${have}/${l.qty}`, x + w - (compact ? 40 : 48), cy + rowIn / 2 + 6, { s: compact ? 15 : 16, a: 'right', c: ok ? '#2a8a2a' : over ? '#c0392b' : '#6a5a40' });
    if (ok) SP('ok', x + w - 18, cy + rowIn / 2, compact ? .42 : .5, .5, .5);
    cy += rowH;
  }
  if (isPay) {
    const bh = compact ? 44 : 54; cy += 3; ctx.fillStyle = '#e8f1ff'; rr(ctx, x + 10, cy, w - 20, bh, 8); ctx.fill();
    T(`Total ${rp(c.total)}`, x + 20, cy + (compact ? 18 : 20), { s: 13, c: '#2a3a5a' });
    T(`Bayar ${rp(c.pay)}`, x + 20, cy + (compact ? 36 : 40), { s: 13, c: '#2a3a5a' });
    T('Kembali', x + w - 20, cy + (compact ? 16 : 20), { s: 11, a: 'right', c: '#2a3a5a' });
    T(rp(c.change), x + w - 20, cy + (compact ? 38 : 42), { s: compact ? 18 : 20, a: 'right', c: '#c0392b' });
  }
  // sabar
  const pr = clamp(c.patience / c.max, 0, 1);
  ctx.fillStyle = '#d9cbb0'; rr(ctx, x + 14, y + hh - (compact ? 14 : 18), w - 28, compact ? 6 : 8, 4); ctx.fill();
  ctx.fillStyle = pr > .5 ? '#5ac85a' : pr > .25 ? '#f0b429' : '#e0463a'; rr(ctx, x + 14, y + hh - (compact ? 14 : 18), Math.max(6, (w - 28) * pr), compact ? 6 : 8, 4); ctx.fill();
  ctx.restore();
}
