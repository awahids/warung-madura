import { SZ, flow, groundShadow, shelfPlank, nameTag, scaleH } from './layout';
import { ATLAS } from '../atlas.js';
import { SFX } from '../audio.js';
import { H, HUD_H, W } from '../constants.js';
import { BY } from '../data.js';
import { ctx } from '../gfx.js';
import { ico } from '../icons.js';
import { drinkKopi, receiveDelivery, usePromo } from '../logic/actions.js';
import { addToTray, doHitung } from '../logic/customers.js';
import { darkness, drawBackground } from './background.js';
import { drawTray } from './tray.js';
import { SP, badge } from '../sprites.js';
import { G, ui } from '../state.js';
import { regTier } from '../logic/regulars.js';
import { T, clamp, rp, rr, wrapText } from '../util.js';

export function drawCustomer(c) {
  const sc = (c.sc || 1) * (c.type === 'hoodie' ? 1 : 1);
  const bob = Math.sin(c.bob || 0) * 2.2;
  const a = ATLAS[c.spr], hgt = a[3] * sc;
  const dim = c.state !== 'leave' && c.idx > 0 && G.cust.indexOf(c) > 0;
  SP(c.spr, c.x, (c.y || 512) + bob, sc, .5, 1, { al: dim ? .9 : 1, flip: c.dir === -1 && false });
  return hgt;
}

export function drawBubble(c, at) {
  const x = at ? at.x : 722, y = at ? at.y : 128, w = 296;
  const sayL = wrapText(c.say, w - 28, 14, '600');
  const isPay = c.stage === 'pay';
  const lines = c.order.length;
  const hh = 40 + sayL.length * 18 + lines * 36 + (isPay ? 62 : 0) + 22;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, x + 3, y + 6, w, hh, 14); ctx.fill();
  ctx.fillStyle = '#fffaf0'; rr(ctx, x, y, w, hh, 14); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#5a3a1a'; ctx.stroke();
  ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(x, y + 60); ctx.lineTo(x - 18, y + 76); ctx.lineTo(x, y + 84); ctx.fill();
  ctx.strokeStyle = '#5a3a1a'; ctx.beginPath(); ctx.moveTo(x, y + 58); ctx.lineTo(x - 18, y + 76); ctx.lineTo(x, y + 86); ctx.stroke();
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(x - 1, y + 61, 3, 22);
  let cy = y + 24;
  T(c.name + (c.reg ? ' ' + '★'.repeat(regTier(c.reg)) : '') + (c.event === 'kasbon' ? '  · KASBON' : ''), x + 14, cy, { s: 15, c: c.event === 'kasbon' ? '#c0392b' : '#8a5424' }); cy += 6;
  sayL.forEach(l => { cy += 18; T(l, x + 14, cy, { s: 14, w: '600', c: '#3a2a1a' }); });
  cy += 10;
  for (const l of c.order) {
    const have = G.tray[l.id] || 0, ok = have === l.qty, over = have > l.qty;
    ctx.fillStyle = ok ? '#dff5d2' : over ? '#fbdada' : '#f4ead2'; rr(ctx, x + 10, cy, w - 20, 32, 8); ctx.fill();
    ico(l.id, x + 14, cy - 1, 34);
    T(BY[l.id].name, x + 54, cy + 21, { s: 15, c: '#3a2a1a' });
    T(`${have}/${l.qty}`, x + w - 48, cy + 22, { s: 16, a: 'right', c: ok ? '#2a8a2a' : over ? '#c0392b' : '#6a5a40' });
    if (ok) SP('ok', x + w - 18, cy + 16, .5, .5, .5);
    cy += 36;
  }
  if (isPay) {
    cy += 4; ctx.fillStyle = '#e8f1ff'; rr(ctx, x + 10, cy, w - 20, 54, 8); ctx.fill();
    T(`Total ${rp(c.total)}`, x + 20, cy + 20, { s: 14, c: '#2a3a5a' });
    T(`Bayar ${rp(c.pay)}`, x + 20, cy + 40, { s: 14, c: '#2a3a5a' });
    T(`Kembali`, x + w - 20, cy + 20, { s: 12, a: 'right', c: '#2a3a5a' });
    T(rp(c.change), x + w - 20, cy + 42, { s: 20, a: 'right', c: '#c0392b' });
  }
  // sabar
  const pr = clamp(c.patience / c.max, 0, 1);
  ctx.fillStyle = '#d9cbb0'; rr(ctx, x + 14, y + hh - 18, w - 28, 8, 4); ctx.fill();
  ctx.fillStyle = pr > .5 ? '#5ac85a' : pr > .25 ? '#f0b429' : '#e0463a'; rr(ctx, x + 14, y + hh - 18, Math.max(6, (w - 28) * pr), 8, 4); ctx.fill();
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
}

