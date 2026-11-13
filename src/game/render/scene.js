import { socialChip } from './social.js';
import { SZ, flow, groundShadow, shelfPlank, nameTag, scaleH } from './layout';
import { ATLAS } from '../atlas.js';
import { SFX } from '../audio.js';
import { FONT, H, HUD_H, W } from '../constants.js';
import { BY } from '../data.js';
import { ctx } from '../gfx.js';
import { ico } from '../icons.js';
import { drinkKopi, receiveDelivery, usePromo } from '../logic/actions.js';
import { addToTray, doHitung } from '../logic/customers.js';
import { darkness, drawBackground } from './background.js';
import { drawTray } from './tray.js';
import { SP, badge, canAct, hit } from '../sprites.js';
import { G, mouse, ui } from '../state.js';
import { itemOn } from '../logic/level.js';
import { regTier } from '../logic/regulars.js';
import { T, clamp, inRect, rp, rr, wrapText } from '../util.js';

export function drawCustomer(c) {
  const sc = (c.sc || 1) * (c.type === 'hoodie' ? 1 : 1);
  const bob = Math.sin(c.bob || 0) * 2.2;
  const a = ATLAS[c.spr], hgt = a[3] * sc;
  const dim = c.state !== 'leave' && c.idx > 0 && G.cust.indexOf(c) > 0;
  SP(c.spr, c.x, (c.y || 512) + bob, sc, .5, 1, { al: dim ? .9 : 1, flip: c.dir === -1 && false });
  return hgt;
}

/** Ukuran balon pesanan. compact: versi ringkas untuk mode 3D (tidak menutupi banyak barang). */
export function bubbleSize(c, compact = false) {
  const w = compact ? 232 : 296, lines = c.order.length, isPay = c.stage === 'pay';
  const nSay = compact ? 1 : wrapText(c.say, w - 28, 14, '600').length;
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
  const sayAll = wrapText(c.say, w - 28, compact ? 13 : 14, '600'), sayL = compact ? [sayAll[0] + (sayAll.length > 1 ? '…' : '')] : sayAll;
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

export function drawScene() {
  drawBackground();
  // pelanggan antrean (belakang dulu)
  const q = [...G.cust].sort((a, b) => (b.idx || 0) - (a.idx || 0));
  for (const c of G.leaving) {
    drawCustomer(c);
    if (c.bye && c.leaveT < 1.6) { const w = Math.max(80, c.bye.length * 8.5); ctx.fillStyle = '#fffaf0'; rr(ctx, c.x - w / 2, 215, w, 30, 12); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.stroke(); T(c.bye, c.x, 236, { s: 13, a: 'center', c: '#3a2a1a' }); }
  }
  for (const c of q) {
    drawCustomer(c);
    if (c.idx > 0) { // mini kesabaran
      const pr = clamp(c.patience / c.max, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, c.x - 30, 232, 60, 8, 4); ctx.fill();
      ctx.fillStyle = pr > .5 ? '#5ac85a' : pr > .25 ? '#f0b429' : '#e0463a'; rr(ctx, c.x - 30, 232, Math.max(5, 60 * pr), 8, 4); ctx.fill();
    }
  }

  // rak bensin (kiri) + barang di tanah kanan
  const R = (name, x, y, sc, ax, ay, id) => {
    const it = BY[id]; const r = SP(name, x, y, sc, ax, ay, { fn: () => addToTray(id), tip: `${it.name} · ${rp(it.price)} · stok ${G.stock[id]}` });
    badge(r, G.stock[id] || 0); return r;
  };
  SP('promo', 14, 70, .9, 0, 0, { fn: usePromo, tip: G.promo ? 'Promo sedang aktif' : 'Pasang promo Rp 20.000 (pembeli lebih ramai)', glow: G.promo, glowC: 'rgba(120,255,120,.9)' });
  T(G.promo ? 'PROMO AKTIF' : 'PROMO Rp20rb', 14 + 42, 162, { s: 12, a: 'center', c: G.promo ? '#9dff8c' : '#fff', stroke: 'rgba(0,0,0,.7)', sw: 3 });
  // barang di trotoar: semua berdiri di garis y=500, tinggi seragam, rata kanan
  groundShadow(82, 500, 150); R('rakBensin', 82, 500, scaleH('rakBensin', SZ.rakBensin), .5, 1, 'bensin');
  nameTag(82, 500 - SZ.rakBensin - 28, 'BENSIN ' + rp(12000).replace('Rp ', ''));
  const ground = flow([{ spr: 'gas', id: 'gas' }, { spr: 'galon', id: 'galon' }, { spr: 'beras2', id: 'beras' }], { h: SZ.ground, gap: 20, x: 1250, align: 'right' });
  for (const s of ground.slots) { groundShadow(s.cx, 500, s.w); R(s.spr, s.cx, 500, s.sc, .5, 1, s.id); }

  // ---------- awning / banner ----------
  ctx.fillStyle = '#7a4a22'; ctx.fillRect(0, HUD_H, W, 40);
  ctx.fillStyle = '#a8672f'; ctx.fillRect(0, HUD_H, W, 8);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, HUD_H + 40, W, 8);
  for (let x = 0; x < W; x += 64) { ctx.fillStyle = (x / 64) % 2 ? '#c4392d' : '#f4efe0'; ctx.beginPath(); ctx.moveTo(x, HUD_H + 40); ctx.lineTo(x + 64, HUD_H + 40); ctx.lineTo(x + 64, HUD_H + 52); ctx.quadraticCurveTo(x + 32, HUD_H + 66, x, HUD_H + 52); ctx.fill(); }
  const dk = darkness(G.h);
  ctx.fillStyle = '#ffd23a'; rr(ctx, 440, 62, 400, 44, 8); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#8a1b10'; ctx.stroke();
  T('WARUNG MADURA', 640, 90, { s: 30, a: 'center', c: '#c0281a', stroke: '#fff3b0', sw: 2, w: '900' });
  T('Sembako · Minuman · Rokok · Pulsa', 640, 103, { s: 11, a: 'center', c: '#5a1a0a' });
  if (dk > .25) { ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 26; ctx.fillStyle = '#fff'; ctx.fillRect(400, 116, 480, 4); ctx.restore(); }
  SP(G.doorState === 'open' ? 'signBuka' : 'signTutup', 910, 60, .85, 0, 0);
  SP('bendera', 1236, 66, .62, .5, 0);
  // gantungan renteng
  const kopiR = SP('renteng2', 238, 100, scaleH('renteng2', SZ.hang), .5, 0, { fn: () => addToTray('kopi'), tip: `Kopi Sachet · ${rp(2000)} · stok ${G.stock.kopi}` });
  badge(kopiR, G.stock.kopi || 0);
  const snR = SP('rakChips', 366, 100, scaleH('rakChips', SZ.hang), .5, 0, { fn: () => addToTray('snack'), tip: `Keripik Renteng · ${rp(2000)} · stok ${G.stock.snack}` });
  badge(snR, G.stock.snack || 0);

  // ---------- meja counter ----------
  const cg = ctx.createLinearGradient(0, 500, 0, H); cg.addColorStop(0, '#b97a3e'); cg.addColorStop(.35, '#a5682f'); cg.addColorStop(1, '#6f4220');
  ctx.fillStyle = cg; ctx.fillRect(0, 500, W, 220);
  ctx.fillStyle = '#d19a5c'; ctx.fillRect(0, 496, W, 8);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, 504, W, 5);
  ctx.strokeStyle = 'rgba(60,30,10,.25)'; ctx.lineWidth = 2;
  for (let y = 540; y < H; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // etalase rokok (kiri, rata di garis y=606)
  groundShadow(258, 606, 210);
  const et = SP('etalase', 258, 606, scaleH('etalase', SZ.etalase), .5, 1, { fn: () => addToTray('rokok'), tip: `Rokok Ketengan · ${rp(2000)} · stok ${G.stock.rokok}` });
  badge(et, G.stock.rokok || 0);
  nameTag(258, 606 - SZ.etalase - 30, 'ROKOK ' + rp(2000).replace('Rp ', '') + '/btg');
  // rak sembako (2D): papan kayu di atas dengan ikon barang tambahan (hanya yang sudah terbuka)
  { const SEMB = ['telur', 'minyak', 'gula', 'sabun', 'susu', 'teh'].filter(itemOn);
    if (SEMB.length) {
      const bx = 436, by = 196, bw = SEMB.length * 62 + 24;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, bx + 2, by + 5, bw, 16, 5); ctx.fill();
      const gr = ctx.createLinearGradient(0, by, 0, by + 16); gr.addColorStop(0, '#e0b070'); gr.addColorStop(1, '#9a6430'); ctx.fillStyle = gr; rr(ctx, bx, by, bw, 16, 5); ctx.fill(); ctx.strokeStyle = '#6b4020'; ctx.lineWidth = 2; ctx.stroke();
      SEMB.forEach((id, i) => {
        const ix = bx + 12 + i * 62, iy = by - 56, hv = canAct() && inRect(mouse.x, mouse.y, ix, iy, 56, 56), it = BY[id];
        if (hv) { ctx.fillStyle = 'rgba(255,236,140,.35)'; rr(ctx, ix - 2, iy - 2, 60, 60, 8); ctx.fill(); }
        ico(id, ix, iy, 56);
        if (canAct()) { hit(ix, iy, 56, 56, () => addToTray(id), `${it.name} · ${rp(it.price)} · stok ${G.stock[id] || 0}`); if (hv) ui.tooltip = `${it.name} · ${rp(it.price)} · stok ${G.stock[id] || 0}`; }
        const n = G.stock[id] || 0; ctx.fillStyle = n === 0 ? '#d62f2f' : n <= 2 ? '#e08a1c' : '#3b2412'; ctx.beginPath(); ctx.arc(ix + 50, iy + 6, 13, 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); T(String(n), ix + 50, iy + 11, { s: 13, a: 'center', c: '#fff' });
      });
    } }
  // rak minuman: tinggi seragam, jarak merata, berdiri di papan kayu
  const shelf = flow([{ spr: 'toples', id: 'kerupuk' }, { spr: 'mie', id: 'mie' }, { spr: 'aqua', id: 'aqua' }, { spr: 'cola', id: 'cola' }, { spr: 'redbull', id: 'redbull' }], { h: SZ.shelf, gap: 22, x: 420 });
  shelfPlank(shelf.left, shelf.right, 586, shelf.slots);
  for (const s of shelf.slots) { groundShadow(s.cx, 586, s.w); R(s.spr, s.cx, 586, s.sc, .5, 1, s.id); }
  // peralatan kasir di ujung kanan meja
  const gear = flow([{ spr: 'printer', h: SZ.gear }, { spr: 'scanner', h: SZ.gear + 12 }], { h: SZ.gear, gap: 24, x: shelf.right + 60 });
  for (const s of gear.slots) { groundShadow(s.cx, 592, s.w); SP(s.spr, s.cx, 592, s.sc, .5, 1); }

  // barisan depan
  const deliver = G.deliveries.find(d => G.abs >= d.eta);
  if (deliver) {
    const bob = Math.sin(ui.frame / 12) * 4;
    SP('dusAqua', 70, 705 + bob * 0, 1.15, .5, 1, { fn: receiveDelivery, tip: 'Kardus dari kurir — klik untuk terima barang', glow: true, glowC: 'rgba(120,200,255,.95)' });
    SP('lonceng', 112, 612 + bob, .7, .5, .5);
  } else if (G.deliveries.length) {
    SP('dusAqua', 70, 705, 1.05, .5, 1, { al: .35 });
    const d = G.deliveries[0]; const mins = Math.max(0, d.eta - G.abs);
    T(`Kurir ±${Math.ceil(mins / 60 * 10) / 10}j`, 70, 628, { s: 12, a: 'center', c: '#fff', stroke: 'rgba(0,0,0,.6)', sw: 3 });
  }
  SP('buku', 175, 706, 1.2, .5, 1, { fn: () => { ui.modal = 'notebook'; SFX.click(); }, tip: 'Buku Catatan — cek stok & harga', always: true });
  SP('kalkulator', 278, 706, 1.3, .5, 1, { fn: doHitung, tip: 'Kalkulator — hitung belanjaan' });
  SP('hp', 925, 708, 1.2, .5, 1, { fn: () => { ui.modal = 'phone'; SFX.click(); }, tip: 'HP — pesan barang ke grosir / main medsos', always: true });
  SP('gelas', 1010, 706, 1.05, .5, 1, { fn: drinkKopi, tip: 'Seduh kopi — +18 energi (pakai 1 kopi sachet)' });
  SP('signKasir', 1185, 712, .85, .5, 1);

  drawTray();
  socialChip(362, 560);
}

