import { SFX } from '../audio.js';
import { H, W, WIN_GOAL } from '../constants.js';
import { BY, ITEMS } from '../data.js';
import { ctx } from '../gfx.js';
import { ico } from '../icons.js';
import { cycleQuality, qualityLabel } from '../quality.js';
import { ACH, unlocked, unlockedCount } from '../logic/achievements.js';
import { INTRO } from '../story/events.js';
import { catatan, chapterName, chapterOf, choiceOk, chooseEvent, closeStoryEvent, currentEvent, installment, orderBlocked, payDebt, story, trust, epilog } from '../logic/story.js';
import { EXPRESS_MIN, orderCost, packPrice, placeOrder, reorder, usePhone } from '../logic/actions.js';
import { FEATURE_LVL, ITEM_LVL, MAX_LEVEL, UNLOCK_LEVELS, discountOf, etaOf, featureOn, itemOn, level, levelBonus, rankOf, unlocksAt, xpAt } from '../logic/level.js';
import { nextDay } from '../logic/day.js';
import { loadSave, save } from '../persist.js';
import { SP } from '../sprites.js';
import { G, ui } from '../state.js';
import { T, clamp, rp, rr, wrapText } from '../util.js';
import { button, panel } from '../widgets.js';

export function drawModals() {
  if (!ui.modal) { ui.modalName = null; return; }
  ui.hits.length = 0; ui.tooltip = '';
  ctx.fillStyle = 'rgba(10,5,0,.62)'; ctx.fillRect(0, 0, W, H);
  // animasi muncul: memudar + naik sedikit (±10 frame); area klik tidak ikut bergeser
  if (ui.modalName !== ui.modal) { ui.modalName = ui.modal; ui.modalT = 0; }
  ui.modalT = Math.min(1, ui.modalT + .1); const ease = 1 - (1 - ui.modalT) ** 3;
  ctx.save(); ctx.globalAlpha = ease; ctx.translate(0, (1 - ease) * 16);
  drawModalBody();
  ctx.restore();
}
function drawModalBody() {
  if (ui.modal === 'notebook') notebook();
  else if (ui.modal === 'phone') phone();
  else if (ui.modal === 'level') levelModal();
  else if (ui.modal === 'event') eventModal();
  else if (ui.modal === 'epilog') epilogModal();
  else if (ui.modal === 'bab') babModal();
  else if (ui.modal === 'ach') achModal();
  else if (ui.modal === 'summary') summary();
  else if (ui.modal === 'help') help();
  else if (ui.modal === 'pause') pauseMenu();
  else if (ui.modal === 'win') winModal();
}
export function closeBtn(x, y, fn) { SP('no', x, y, .75, .5, .5, { fn: () => { SFX.click(); fn(); }, always: true, pad: ui.touch ? 14 : 4 }); }
export function notebook() {
  const x = 120, y = 40, w = 1040, h = 640;
  panel(x, y, w, h, { fill: '#f7ecca' });
  ctx.strokeStyle = 'rgba(110,80,40,.18)'; ctx.lineWidth = 1; for (let ly = y + 110; ly < y + h - 30; ly += 28) { ctx.beginPath(); ctx.moveTo(x + 26, ly); ctx.lineTo(x + w - 26, ly); ctx.stroke(); }
  T('BUKU CATATAN', x + 34, y + 54, { s: 30, c: '#6b3a14' });
  T('Cek stok & harga. Untuk memesan barang ke grosir, pakai HP.', x + 36, y + 80, { s: 14, w: '600', c: '#7a5a3a' });
  closeBtn(x + w - 36, y + 38, () => { ui.modal = null; });
  ITEMS.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2), rx = x + 30 + col * 500, ry = y + 100 + row * 66;
    ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, rx, ry, 480, 58, 10); ctx.fill(); ctx.strokeStyle = '#d6bf8a'; ctx.lineWidth = 2; ctx.stroke();
    ico(it.id, rx + 8, ry + 5, 48);
    T(it.name, rx + 66, ry + 24, { s: 16, c: '#3a210c' });
    T(`jual ${rp(it.price)} · modal ${rp(Math.round(it.cost))}/pcs · laba ${rp(Math.round(it.price - it.cost))}`, rx + 66, ry + 44, { s: 12, w: '600', c: '#7a5a3a' });
    const n = G.stock[it.id] || 0;
    if (!itemOn(it.id)) { ctx.fillStyle = 'rgba(225,220,205,.8)'; rr(ctx, rx, ry, 480, 58, 10); ctx.fill(); T(`Terkunci · buka di Level ${ITEM_LVL[it.id]}`, rx + 462, ry + 36, { s: 15, a: 'right', c: '#a05a1a' }); return; }
    T(`stok ${n}`, rx + 462, ry + 36, { s: 20, a: 'right', c: n <= 2 ? '#c0392b' : '#3a6a2a' });
  });
  const by = y + h - 130;
  T('Uang kas: ' + rp(G.money), x + 36, by + 28, { s: 18, c: '#5a3a1a' });
  const debt = G.debts.reduce((s, d) => s + d.amount, 0);
  T(`Kasbon belum dibayar: ${rp(debt)} (${G.debts.length} catatan)`, x + 36, by + 54, { s: 14, w: '600', c: '#7a3a1a' });
  const pend = G.deliveries.length ? 'Dalam perjalanan: ' + G.deliveries.map(d => Object.entries(d.items).map(([k, v]) => `${v} ${BY[k].name}`).join(', ')).join(' | ') : '';
  if (pend) T(pend.length > 100 ? pend.slice(0, 98) + '…' : pend, x + 36, by + 80, { s: 12, w: '600', c: '#3a5a8a' });
  { const st = story(); T(st.easy ? 'Mode santai: tanpa cicilan' : st.lunas ? 'Utang ke Koh Awi lunas' : `Utang Koh Awi ${rp(st.debt)} · cicilan hari ke-${st.due}: ${rp(installment())}`, x + 36, by + 106, { s: 13, w: '700', c: '#7a3a1a' });
    if (!st.lunas && st.debt > 0) button(x + w - 700, by + 18, 230, 54, 'BAYAR UTANG +50rb', () => payDebt(50000), { col: 'blue', s: 16, disabled: G.money < Math.min(50000, st.debt), tip: 'Cicil lebih awal ke Koh Awi' }); }
  button(x + w - 460, by + 18, 250, 54, 'PESAN LEWAT HP', () => { ui.modal = 'phone'; }, { col: 'green', s: 20 });
  button(x + w - 200, by + 18, 170, 54, 'TUTUP', () => { ui.modal = null; }, { col: 'wood', s: 20 });
}
/** HP: aplikasi grosir untuk memesan stok (harga turun seiring level) + medsos untuk isi energi.
    Daftar dibagi per halaman (6 barang, barang terbuka dulu) agar tombol cukup besar untuk jari. */
export function phone() {
  const L = level(), px = 390, py = 8, pw = 500, ph = 704, RH = 60, PER = 6;
  const list = [...ITEMS.filter(i => itemOn(i.id)), ...ITEMS.filter(i => !itemOn(i.id))], pages = Math.ceil(list.length / PER);
  ui.phonePage = clamp(ui.phonePage || 0, 0, pages - 1);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, px + 6, py + 10, pw, ph, 44); ctx.fill();
  ctx.fillStyle = '#15171c'; rr(ctx, px, py, pw, ph, 44); ctx.fill(); ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#f4f6f8'; rr(ctx, px + 12, py + 12, pw - 24, ph - 24, 34); ctx.fill();
  const hh = Math.floor(G.h) % 24, mm = Math.floor((G.h % 1) * 60);
  T(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, px + 40, py + 42, { s: 14, c: '#333' });
  T(`Lv ${L}`, px + pw - 40, py + 42, { s: 14, a: 'right', c: '#333' });
  ctx.fillStyle = '#2f9e44'; ctx.fillRect(px + 12, py + 52, pw - 24, 54);
  T('GrosirKu · Pesan Barang', px + 28, py + 76, { s: 20, c: '#fff' });
  const disc = Math.round(discountOf(L) * 100);
  T(orderBlocked() ? 'PESANAN DITAHAN Koh Awi — lunasi cicilan dulu' : `Kas ${rp(G.money)} · diskon level ${disc}% · kurir ±${G.express && featureOn('express') ? EXPRESS_MIN : etaOf(L)} mnt`, px + 28, py + 97, { s: 12, w: '600', c: '#e4ffe9' });
  if (orderBlocked()) { ctx.fillStyle = '#c0392b'; ctx.fillRect(px + 12, py + 106, pw - 24, 6); }
  button(px + pw - 134, py + 58, 108, 38, 'Medsos', usePhone, { col: 'blue', s: 14, tip: 'Scroll medsos — isi energi (jangan saat ada pembeli!)' });
  list.slice(ui.phonePage * PER, ui.phonePage * PER + PER).forEach((it, i) => {
    const ry = py + 114 + i * RH, q = G.cart[it.id] || 0, n = G.stock[it.id] || 0, on = itemOn(it.id);
    ctx.fillStyle = !on ? '#dfe2e6' : i % 2 ? '#e9eef2' : '#fff'; rr(ctx, px + 20, ry, pw - 40, RH - 4, 10); ctx.fill();
    ctx.globalAlpha = on ? 1 : .4; ico(it.id, px + 26, ry + 8, 40); ctx.globalAlpha = 1;
    T(it.name, px + 76, ry + 24, { s: 16, c: on ? '#222' : '#777' });
    if (!on) { T(`Terkunci · buka di Level ${ITEM_LVL[it.id]}`, px + 76, ry + 44, { s: 13, w: '700', c: '#a05a1a' }); return; }
    T(`isi ${it.pack} · ${rp(packPrice(it))}`, px + 76, ry + 44, { s: 12, w: '600', c: '#667' });
    T(`stok ${n}`, px + 292, ry + 32, { s: 13, a: 'center', c: n <= 2 ? '#c0392b' : '#3a6a2a' });
    button(px + 328, ry + 5, 50, 46, '−', () => { if (q > 0) G.cart[it.id] = q - 1; }, { col: 'red', s: 26, disabled: q <= 0 });
    T(String(q), px + 402, ry + 38, { s: 24, a: 'center', c: '#222' });
    button(px + 424, ry + 5, 50, 46, '+', () => { G.cart[it.id] = q + 1; }, { col: 'green', s: 26 });
  });
  const cost = orderCost(), fy = py + 114 + PER * RH + 2, exOn = featureOn('express');
  T('Total', px + 30, fy + 24, { s: 16, c: '#333' }); T(rp(cost), px + pw - 30, fy + 28, { s: 25, a: 'right', c: cost > G.money ? '#c0392b' : '#1f7a2f' });
  if (exOn) button(px + 96, fy + 2, 210, 36, (G.express ? '[x] ' : '[ ] ') + 'Kurir ekspres +15%', () => { G.express = !G.express; }, { col: G.express ? 'yellow' : 'grey', s: 13, tc: G.express ? '#4a2a00' : '#fff' });
  else T(`Kurir ekspres: Level ${FEATURE_LVL.express}`, px + 96, fy + 24, { s: 12, w: '700', c: '#a05a1a' });
  const by = fy + 44;
  button(px + 24, by, 140, 52, 'PESAN', placeOrder, { col: 'green', s: 21, disabled: !cost || cost > G.money });
  if (featureOn('reorder')) button(px + 172, by, 92, 52, 'ULANG', reorder, { col: 'yellow', s: 15, tc: '#4a2a00', tip: 'Isi keranjang dengan pesanan terakhir' });
  button(px + 272, by, 92, 52, 'KOSONG', () => { G.cart = {}; }, { col: 'blue', s: 15 });
  button(px + 372, by, 104, 52, 'TUTUP', () => { ui.modal = null; }, { col: 'wood', s: 17 });
  const ny = by + 62;
  button(px + 24, ny, 196, 46, '◀ Sebelumnya', () => { ui.phonePage--; }, { col: 'grey', s: 15, disabled: ui.phonePage <= 0 });
  T(`${ui.phonePage + 1}/${pages}`, px + pw / 2, ny + 30, { s: 16, a: 'center', c: '#555', w: '700' });
  button(px + 280, ny, 196, 46, 'Berikutnya ▶', () => { ui.phonePage++; }, { col: 'grey', s: 15, disabled: ui.phonePage >= pages - 1 });
  if (!featureOn('reorder')) T(`Pesan ulang: Level ${FEATURE_LVL.reorder}`, px + 30, ny + 66, { s: 12, w: '700', c: '#a05a1a' });
}
/** Dialog kejadian cerita: pilihan → akibat langsung. */
export function eventModal() {
  const ev = currentEvent(); if (!ev) { ui.modal = null; return; }
  const st = story(), x = 270, w = 740, y = 70, h = 580;
  panel(x, y, w, h);
  ctx.fillStyle = '#c98a4b'; rr(ctx, x + 30, y + 24, 250, 28, 14); ctx.fill();
  T(`BAB ${chapterOf()} · ${chapterName()}`.toUpperCase(), x + 155, y + 44, { s: 14, a: 'center', c: '#fff', stroke: '#6b3a14', sw: 3 });
  T(ev.who, x + 36, y + 96, { s: 30, c: '#6b3a14' });
  const lines = wrapText(ev.text, w - 80, 20, '600');
  lines.forEach((l, i) => T(l, x + 40, y + 140 + i * 28, { s: 20, w: '600', c: '#3a210c' }));
  const by = y + 140 + lines.length * 28 + 26;
  if (!st.result) {
    T('Apa yang kamu lakukan?', x + 40, by, { s: 14, w: '700', c: '#7a5a3a' });
    ev.choices.forEach((c, i) => {
      const ok = choiceOk(c);
      button(x + 40, by + 16 + i * 66, w - 80, 56, c.t + (ok ? '' : ' (tidak cukup)'), () => chooseEvent(i), { col: ok ? 'wood' : 'grey', s: 18, disabled: !ok });
    });
  } else {
    const rl = wrapText(st.result.text, w - 80, 19, '700');
    rl.forEach((l, i) => T(l, x + 40, by + i * 27, { s: 19, w: '700', c: '#2a5a1a' }));
    const ly = by + rl.length * 27 + 14;
    st.result.lines.forEach((t, i) => { const neg = /^−|−/.test(t) || /menunggak|mundur/.test(t); T(t, x + 44, ly + i * 24, { s: 16, w: '700', c: neg ? '#b3281e' : '#2a6a2a' }); });
    button(x + w / 2 - 110, y + h - 80, 220, 54, 'LANJUT', closeStoryEvent, { col: 'green', s: 22 });
  }
}
/** Kartu pembuka bab. */
export function babModal() {
  const c = chapterOf(), it = INTRO[c - 1]; if (!it) { ui.modal = null; return; }
  const x = 290, y = 120, w = 700, h = 460; panel(x, y, w, h);
  T(`BAB ${c}`, x + w / 2, y + 70, { s: 20, a: 'center', c: '#7a5a3a', w: '700' });
  T(chapterName(c).toUpperCase(), x + w / 2, y + 124, { s: 46, a: 'center', c: '#b87a14', stroke: '#fff3c8', sw: 3 });
  const ls = wrapText(it.text, w - 100, 20, '600'); ls.forEach((l, i) => T(l, x + w / 2, y + 180 + i * 28, { s: 20, a: 'center', w: '600', c: '#3a210c' }));
  const gy = y + 180 + ls.length * 28 + 24;
  ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, x + 40, gy, w - 80, 56, 10); ctx.fill();
  T('TUJUAN', x + 56, gy + 22, { s: 12, w: '800', c: '#a05a1a' });
  wrapText(it.goal, w - 120, 16, '700').forEach((l, i) => T(l, x + 56, gy + 42 + i * 20, { s: 16, w: '700', c: '#2a5a1a' }));
  button(x + w / 2 - 110, y + h - 76, 220, 54, 'MULAI', () => { ui.modal = null; }, { col: 'green', s: 22 });
}
/** Daftar pencapaian. */
export function achModal() {
  const x = 150, y = 40, w = 980, h = 640; panel(x, y, w, h);
  T('PENCAPAIAN', x + 36, y + 56, { s: 32, c: '#6b3a14' });
  T(`${unlockedCount()}/${ACH.length} terbuka · tiap pencapaian memberi +25 XP`, x + 36, y + 84, { s: 14, w: '700', c: '#7a5a3a' });
  closeBtn(x + w - 40, y + 40, () => { ui.modal = 'pause'; });
  ACH.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2), rx = x + 30 + col * 470, ry = y + 108 + row * 74, got = unlocked(a.id);
    ctx.fillStyle = got ? 'rgba(120,200,110,.35)' : 'rgba(255,255,255,.5)'; rr(ctx, rx, ry, 450, 64, 10); ctx.fill(); ctx.strokeStyle = got ? '#5aa84a' : '#d6bf8a'; ctx.lineWidth = 2; ctx.stroke();
    T(got ? '★' : '☆', rx + 28, ry + 42, { s: 30, a: 'center', c: got ? '#e0a010' : '#b8a888' });
    T(a.name, rx + 56, ry + 26, { s: 17, c: got ? '#1f4a12' : '#6a5a4a' });
    T(a.desc, rx + 56, ry + 48, { s: 13, w: '600', c: got ? '#2a6a1a' : '#8a7a6a' });
  });
}
/** Epilog: akhir cerita utama (permainan tetap bisa dilanjutkan). */
export function epilogModal() {
  const ep = epilog(); if (!ep) { ui.modal = null; return; }
  const x = 240, y = 60, w = 800, h = 600; panel(x, y, w, h);
  T('EPILOG', x + w / 2, y + 50, { s: 16, a: 'center', c: '#7a5a3a', w: '700' });
  T(ep.title, x + w / 2, y + 100, { s: 44, a: 'center', c: '#b87a14', stroke: '#fff3c8', sw: 3 });
  let yy = y + 150;
  ep.lines.forEach((l, i) => { const ls = wrapText(l, w - 100, i === 0 ? 20 : 17, '600'); ls.forEach(t => { T(t, x + 50, yy, { s: i === 0 ? 20 : 17, w: '600', c: i === 0 ? '#3a210c' : '#5a3a1a' }); yy += i === 0 ? 28 : 24; }); yy += 10; });
  T(`Level ${level()} · Kepercayaan ${Math.round(trust())}/100 · Saldo ${rp(G.money)}`, x + w / 2, y + h - 110, { s: 15, a: 'center', c: '#7a5a3a', w: '700' });
  button(x + w / 2 - 170, y + h - 84, 340, 56, 'LANJUT MAIN (MODE BEBAS)', () => { ui.modal = null; save(); }, { col: 'green', s: 18 });
}
/** Daftar yang dibuka tiap level. */
export function levelModal() {
  const x = 190, y = 36, w = 900, h = 648, L = level(); panel(x, y, w, h);
  T('LEVEL JURAGAN', x + 36, y + 56, { s: 32, c: '#6b3a14' });
  closeBtn(x + w - 40, y + 40, () => { ui.modal = null; });
  T(`Level ${L} · ${rankOf(L)} · ${G.xp || 0} XP${L < MAX_LEVEL ? ` (berikutnya ${xpAt(L + 1)} XP)` : ' (maks.)'}`, x + 36, y + 84, { s: 15, w: '700', c: '#7a5a3a' });
  T(`Level ini: bonus naik level ${rp(levelBonus(L))} · diskon grosir ${Math.round(discountOf(L) * 100)}% · kurir ${etaOf(L)} menit`, x + 36, y + 108, { s: 14, w: '600', c: '#3a6a2a' });
  UNLOCK_LEVELS.forEach((lv, i) => {
    const ry = y + 126 + i * 70, got = L >= lv;
    ctx.fillStyle = got ? 'rgba(120,200,110,.35)' : 'rgba(255,255,255,.5)'; rr(ctx, x + 28, ry, w - 56, 62, 10); ctx.fill(); ctx.strokeStyle = got ? '#5aa84a' : '#d6bf8a'; ctx.lineWidth = 2; ctx.stroke();
    T(`Lv ${lv}`, x + 46, ry + 40, { s: 24, c: got ? '#2a6a1a' : '#8a6a3a' });
    const us = unlocksAt(lv);
    let line = 0;
    for (const k of ['Barang', 'Pembeli', 'Fitur']) {
      const txt = us.filter(u => u.k === k).map(u => u.text).join(', ');
      if (txt) T(`${k}: ${txt}`, x + 140, ry + 22 + line++ * 17, { s: 14, w: '600', c: got ? '#1f4a12' : '#5a3a1a' });
    }
    T(got ? 'TERBUKA' : 'TERKUNCI', x + w - 46, ry + 38, { s: 14, a: 'right', c: got ? '#2a8a2a' : '#a05a1a' });
  });
  T('XP: +10 tiap pembeli (+5 bila cepat, +3 bila dapat tip), +40 tiap misi selesai.', x + 36, y + h - 24, { s: 13, w: '600', c: '#7a5a3a' });
}
export function summary() {
  const x = 330, y = 12, w = 620, h = 696, s = G.stats, st = story(), lp = st.lastPay;
  panel(x, y, w, h);
  T(G.endReason === 'faint' ? 'KAMU PINGSAN!' : 'WARUNG TUTUP', x + w / 2, y + 54, { s: 34, a: 'center', c: G.endReason === 'faint' ? '#b3281e' : '#6b3a14', stroke: '#fff3c8', sw: 2 });
  T(`Rekap Hari ${G.day} · Bab ${chapterOf()} ${chapterName()}`, x + w / 2, y + 80, { s: 15, a: 'center', c: '#7a5a3a', w: '600' });
  const rows = [
    ['Pelanggan dilayani', s.served], ['Pelanggan kecewa', s.left], ['Omzet penjualan', rp(s.revenue)],
    ['Laba kotor', rp(s.profit)], ['Tip', rp(s.tips)], ['Belanja stok & promo', '-' + rp(s.spent)],
    ['Bonus misi & level', '+' + rp(s.bonus)], ['XP didapat · Level ' + level() + ' ' + rankOf(level()), '+' + (s.xp || 0)], ['Kasbon baru', rp(s.kasbonNew)],
  ];
  if (G.endReason === 'faint') rows.splice(7, 0, ['Biaya klinik', '-Rp 15.000']);
  rows.forEach((r, i) => {
    const ry = y + 94 + i * 28; ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.6)'; rr(ctx, x + 30, ry, w - 60, 25, 7); ctx.fill();
    T(r[0], x + 44, ry + 18, { s: 15, c: '#3a210c' }); T(String(r[1]), x + w - 44, ry + 18, { s: 16, a: 'right', c: String(r[1]).startsWith('-') ? '#b3281e' : '#2a6a2a' });
  });
  const by = y + 94 + rows.length * 28 + 6;
  SP('coin', x + 60, by + 24, .8, .5, .5);
  T('SALDO', x + 92, by + 14, { s: 11, c: '#7a5a3a' }); T(rp(G.money), x + 92, by + 40, { s: 27, c: '#b87a14', stroke: '#fff3c8', sw: 2 });
  T(`Target juragan: ${rp(WIN_GOAL)}`, x + w - 40, by + 16, { s: 12, a: 'right', c: '#7a5a3a' });
  ctx.fillStyle = '#d8c28c'; rr(ctx, x + w - 250, by + 24, 210, 11, 6); ctx.fill(); ctx.fillStyle = '#58b948'; rr(ctx, x + w - 250, by + 24, Math.max(8, 210 * clamp(G.money / WIN_GOAL, 0, 1)), 11, 6); ctx.fill();
  // ---- tanggung jawab: cicilan, kepercayaan, kabar kampung, catatan
  const sy = by + 56;
  ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(ctx, x + 24, sy, w - 48, 196, 10); ctx.fill(); ctx.strokeStyle = '#d6bf8a'; ctx.lineWidth = 2; ctx.stroke();
  let line;
  if (st.easy) line = ['Mode santai — tanpa cicilan', '#2a6a2a'];
  else if (st.lunas) line = ['Utang ke Koh Awi LUNAS', '#2a8a2a'];
  else if (lp && lp.ok) line = [`Cicilan ${rp(lp.amount)} dibayar · sisa utang ${rp(st.debt)}`, '#2a6a2a'];
  else if (lp) line = [`Cicilan ${rp(lp.amount)} MENUNGGAK · bunga ${rp(lp.penalty)} · utang ${rp(st.debt)}`, '#b3281e'];
  else line = [`Utang ${rp(st.debt)} · cicilan hari ke-${st.due}: ${rp(installment())}`, '#5a3a1a'];
  T('Koh Awi', x + 40, sy + 24, { s: 13, w: '700', c: '#7a5a3a' }); T(line[0], x + 110, sy + 24, { s: 14, w: '700', c: line[1] });
  T('Kepercayaan', x + 40, sy + 48, { s: 13, w: '700', c: '#7a5a3a' });
  ctx.fillStyle = '#d8c28c'; rr(ctx, x + 130, sy + 38, 200, 12, 6); ctx.fill();
  ctx.fillStyle = trust() >= 60 ? '#58b948' : trust() >= 35 ? '#e0b030' : '#d6483a'; rr(ctx, x + 130, sy + 38, Math.max(8, 200 * trust() / 100), 12, 6); ctx.fill();
  T(`${Math.round(trust())}/100`, x + 340, sy + 49, { s: 13, w: '700', c: '#5a3a1a' });
  T('Kabar kampung', x + 40, sy + 76, { s: 13, w: '700', c: '#7a5a3a' });
  const news = st.kabar.slice(-3);
  if (!news.length) T('Hari yang tenang.', x + 56, sy + 98, { s: 14, w: '600', c: '#7a6a5a' });
  news.forEach((n, i) => T('• ' + (n.length > 78 ? n.slice(0, 76) + '…' : n), x + 40, sy + 98 + i * 22, { s: 14, w: '600', c: '#3a210c' }));
  T('Pak Haji: ' + catatan(), x + 40, sy + 176, { s: 13, w: '600', c: '#6b3a14' });
  const debtK = G.debts.reduce((q, d) => q + d.amount, 0);
  if (debtK) T(`Kasbon warga beredar: ${rp(debtK)}`, x + w - 40, by + 52, { s: 12, a: 'right', c: '#7a3a1a' });
  button(x + 40, y + h - 70, 230, 52, 'HP · PESAN BARANG', () => { ui.modal = 'phone'; }, { col: 'wood', s: 17 });
  button(x + w - 270, y + h - 70, 230, 52, 'TIDUR → HARI ' + (G.day + 1), nextDay, { col: 'green', s: 18 });
}
export function help() {
  const x = 240, y = 50, w = 800, h = 620; panel(x, y, w, h);
  T('CARA MAIN', x + w / 2, y + 56, { s: 32, a: 'center', c: '#6b3a14' });
  closeBtn(x + w - 40, y + 40, () => { ui.modal = null; });
  const L = [
    ['1', 'Buka warung: tarik pintu besi ke atas (drag/klik). Sebelum buka, cek Buku Catatan & pesan stok.'],
    ['2', 'Pembeli datang & menyebut pesanan. Klik barang di rak/etalase/gantungan sesuai pesanan — masuk ke nampan.'],
    ['3', 'Tekan HITUNG (atau klik kalkulator). Kalau uangnya lebih, beri kembalian: klik pecahan uang sampai pas, lalu BERI.'],
    ['4', 'Pembeli sabar terbatas. Pembeli senang → reputasi naik → warung makin ramai. Stok habis? Tekan MAAF, HABIS.'],
    ['5', 'Pesan barang lewat HP (aplikasi GrosirKu). Buku Catatan untuk cek stok. Kurir tiba ± 1,5 jam; klik kardus di kiri bawah untuk menerima.'],
    ['6', 'Kewarasan turun terus, apalagi malam. Isi lewat Medsos di HP (jangan saat ada pembeli) atau seduh kopi (gelas hijau).'],
    ['7', 'Tengah hari kadang ada kasbon: terima = dibayar besok (65%), tolak = reputasi turun. Malam hari waspada tamu misterius…'],
    ['8', 'Selesaikan 3 misi harian untuk bonus. Pasang PROMO. Layani pembeli & selesaikan misi untuk XP: naik LEVEL = bonus kas, diskon grosir, kurir lebih cepat. Target: kumpulkan ' + rp(WIN_GOAL) + '!'],
  ];
  let yy = y + 96;
  L.forEach(([n, t]) => {
    ctx.fillStyle = '#c98a4b'; ctx.beginPath(); ctx.arc(x + 54, yy + 20, 18, 0, 7); ctx.fill(); T(n, x + 54, yy + 27, { s: 20, a: 'center', c: '#fff', stroke: '#6b3a14', sw: 3 });
    const ls = wrapText(t, w - 140, 16, '600'); ls.forEach((l, i) => T(l, x + 90, yy + 18 + i * 21, { s: 16, w: '600', c: '#3a210c' })); yy += Math.max(52, ls.length * 21 + 22);
  });
  button(x + w / 2 - 100, y + h - 74, 200, 50, 'MENGERTI', () => { ui.modal = G.screen === 'play' && G.running ? null : null; }, { col: 'green' });
}
export function pauseMenu() {
  const x = 440, y = 56, w = 400, h = 608; panel(x, y, w, h);
  T('JEDA', x + w / 2, y + 60, { s: 36, a: 'center', c: '#6b3a14' });
  button(x + 50, y + 90, w - 100, 52, 'LANJUT', () => { ui.modal = null; }, { col: 'green' });
  button(x + 50, y + 156, w - 100, 46, 'Suara: ' + (G.sound ? 'NYALA' : 'MATI'), () => { G.sound = !G.sound; save(); }, { col: 'blue', s: 16 });
  button(x + 50, y + 214, w - 100, 46, featureOn('auto') ? 'Kembalian otomatis: ' + (G.auto ? 'ON' : 'OFF') : `Kembalian otomatis: Level ${FEATURE_LVL.auto}`, () => { G.auto = !G.auto; save(); }, { col: G.auto ? 'green' : 'grey', s: 15, disabled: !featureOn('auto') });
  button(x + 50, y + 272, w - 100, 46, 'Mode santai (tanpa cicilan): ' + (story().easy ? 'ON' : 'OFF'), () => { story().easy = !story().easy; save(); }, { col: story().easy ? 'green' : 'grey', s: 14, tip: 'Cicilan utang ditiadakan. Kepercayaan & kejadian tetap jalan.' });
  if (ui.mode3d) button(x + 50, y + 330, w - 100, 46, 'Grafis 3D: ' + qualityLabel(), cycleQuality, { col: 'blue', s: 15, tip: 'Otomatis menurunkan kualitas bila FPS rendah. Rendah: tanpa bayangan & pantulan.' });
  button(x + 50, y + (ui.mode3d ? 388 : 330), w - 100, 46, `PENCAPAIAN ${unlockedCount()}/${ACH.length}`, () => { ui.modal = 'ach'; }, { col: 'yellow', tc: '#4a2a00', s: 16 });
  button(x + 50, y + (ui.mode3d ? 446 : 388), w - 100, 46, 'CARA MAIN', () => { ui.modal = 'help'; }, { col: 'wood', s: 16 });
  button(x + 50, y + (ui.mode3d ? 504 : 446), w - 100, 46, 'MENU UTAMA', () => { save(); ui.modal = null; G.screen = 'title'; ui.hasSave = !!loadSave(); }, { col: 'red', s: 16 });
  T('Kemajuan tersimpan tiap akhir hari.', x + w / 2, y + (ui.mode3d ? 584 : 528), { s: 13, a: 'center', c: '#7a5a3a', w: '600' });
}
export function winModal() {
  const x = 340, y = 150, w = 600, h = 400; panel(x, y, w, h);
  SP('piala', x + w / 2, y + 100, 2, .5, .5);
  T('JURAGAN SUKSES!', x + w / 2, y + 220, { s: 40, a: 'center', c: '#b87a14', stroke: '#fff3c8', sw: 3 });
  T(`Saldo warungmu tembus ${rp(WIN_GOAL)}.`, x + w / 2, y + 258, { s: 18, a: 'center', c: '#3a210c', w: '600' });
  T('Kamu boleh terus main — kejar rekor!', x + w / 2, y + 286, { s: 15, a: 'center', c: '#7a5a3a', w: '600' });
  button(x + w / 2 - 110, y + 320, 220, 54, 'LANJUT MAIN', () => { ui.modal = null; }, { col: 'green' });
}

