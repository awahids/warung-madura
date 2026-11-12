import { SFX } from '../audio.js';
import { H, W, WIN_GOAL } from '../constants.js';
import { BY, ITEMS } from '../data.js';
import { ctx } from '../gfx.js';
import { ico } from '../icons.js';
import { EXPRESS_MIN, orderCost, packPrice, placeOrder, reorder, usePhone } from '../logic/actions.js';
import { FEATURE_LVL, ITEM_LVL, MAX_LEVEL, UNLOCK_LEVELS, discountOf, etaOf, featureOn, itemOn, level, levelBonus, rankOf, unlocksAt, xpAt } from '../logic/level.js';
import { nextDay } from '../logic/day.js';
import { loadSave, save } from '../persist.js';
import { SP } from '../sprites.js';
import { G, ui } from '../state.js';
import { T, clamp, rp, rr, wrapText } from '../util.js';
import { button, panel } from '../widgets.js';

export function drawModals() {
  if (!ui.modal) return;
  ui.hits.length = 0; ui.tooltip = '';
  ctx.fillStyle = 'rgba(10,5,0,.62)'; ctx.fillRect(0, 0, W, H);
  if (ui.modal === 'notebook') notebook();
  else if (ui.modal === 'phone') phone();
  else if (ui.modal === 'level') levelModal();
  else if (ui.modal === 'summary') summary();
  else if (ui.modal === 'help') help();
  else if (ui.modal === 'pause') pauseMenu();
  else if (ui.modal === 'win') winModal();
}
export function closeBtn(x, y, fn) { SP('no', x, y, .75, .5, .5, { fn: () => { SFX.click(); fn(); }, always: true }); }
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
  button(x + w - 460, by + 18, 250, 54, 'PESAN LEWAT HP', () => { ui.modal = 'phone'; }, { col: 'green', s: 20 });
  button(x + w - 200, by + 18, 170, 54, 'TUTUP', () => { ui.modal = null; }, { col: 'wood', s: 20 });
}
/** HP: aplikasi grosir untuk memesan stok (harga turun seiring level) + medsos untuk isi energi. */
export function phone() {
  const L = level(), px = 390, py = 8, pw = 500, ph = 704, RH = 38;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, px + 6, py + 10, pw, ph, 44); ctx.fill();
  ctx.fillStyle = '#15171c'; rr(ctx, px, py, pw, ph, 44); ctx.fill(); ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#f4f6f8'; rr(ctx, px + 12, py + 12, pw - 24, ph - 24, 34); ctx.fill();
  const hh = Math.floor(G.h) % 24, mm = Math.floor((G.h % 1) * 60);
  T(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, px + 40, py + 42, { s: 14, c: '#333' });
  T(`Lv ${L}`, px + pw - 40, py + 42, { s: 14, a: 'right', c: '#333' });
  ctx.fillStyle = '#2f9e44'; ctx.fillRect(px + 12, py + 52, pw - 24, 52);
  T('GrosirKu · Pesan Barang', px + 28, py + 76, { s: 20, c: '#fff' });
  const disc = Math.round(discountOf(L) * 100);
  T(`Kas ${rp(G.money)} · diskon level ${disc}% · kurir ±${G.express && featureOn('express') ? EXPRESS_MIN : etaOf(L)} mnt`, px + 28, py + 96, { s: 12, w: '600', c: '#e4ffe9' });
  button(px + pw - 128, py + 58, 100, 30, 'Medsos', usePhone, { col: 'blue', s: 13, tip: 'Scroll medsos — isi energi (jangan saat ada pembeli!)' });
  ITEMS.forEach((it, i) => {
    const ry = py + 112 + i * RH, q = G.cart[it.id] || 0, n = G.stock[it.id] || 0, on = itemOn(it.id);
    ctx.fillStyle = !on ? '#dfe2e6' : i % 2 ? '#e9eef2' : '#fff'; rr(ctx, px + 20, ry, pw - 40, RH - 3, 8); ctx.fill();
    ctx.globalAlpha = on ? 1 : .4; ico(it.id, px + 24, ry + 2, 30); ctx.globalAlpha = 1;
    T(it.name, px + 62, ry + 15, { s: 13, c: on ? '#222' : '#777' });
    if (!on) { T(`Terkunci · buka di Level ${ITEM_LVL[it.id]}`, px + 62, ry + 29, { s: 11, w: '700', c: '#a05a1a' }); return; }
    T(`isi ${it.pack} · ${rp(packPrice(it))}`, px + 62, ry + 29, { s: 11, w: '600', c: '#667' });
    T(`stok ${n}`, px + 318, ry + 23, { s: 12, a: 'center', c: n <= 2 ? '#c0392b' : '#3a6a2a' });
    button(px + 344, ry + 3, 28, 28, '−', () => { if (q > 0) G.cart[it.id] = q - 1; }, { col: 'red', s: 18, disabled: q <= 0 });
    T(String(q), px + 392, ry + 24, { s: 18, a: 'center', c: '#222' });
    button(px + 412, ry + 3, 28, 28, '+', () => { G.cart[it.id] = q + 1; }, { col: 'green', s: 18 });
  });
  const cost = orderCost(), fy = py + 112 + ITEMS.length * RH + 6, exOn = featureOn('express');
  T('Total', px + 30, fy + 22, { s: 16, c: '#333' }); T(rp(cost), px + pw - 30, fy + 24, { s: 24, a: 'right', c: cost > G.money ? '#c0392b' : '#1f7a2f' });
  if (exOn) button(px + 100, fy + 2, 190, 28, (G.express ? '[x] ' : '[ ] ') + 'Kurir ekspres +15%', () => { G.express = !G.express; }, { col: G.express ? 'yellow' : 'grey', s: 12, tc: G.express ? '#4a2a00' : '#fff' });
  else T(`Kurir ekspres: Level ${FEATURE_LVL.express}`, px + 100, fy + 22, { s: 12, w: '700', c: '#a05a1a' });
  const by = fy + 38;
  button(px + 24, by, 140, 44, 'PESAN', placeOrder, { col: 'green', s: 20, disabled: !cost || cost > G.money });
  if (featureOn('reorder')) button(px + 172, by, 92, 44, 'ULANG', reorder, { col: 'yellow', s: 14, tc: '#4a2a00', tip: 'Isi keranjang dengan pesanan terakhir' });
  button(px + 272, by, 92, 44, 'KOSONG', () => { G.cart = {}; }, { col: 'blue', s: 14 });
  button(px + 372, by, 104, 44, 'TUTUP', () => { ui.modal = null; }, { col: 'wood', s: 16 });
  if (!featureOn('reorder')) T(`Pesan ulang: Level ${FEATURE_LVL.reorder}`, px + 30, by + 62, { s: 12, w: '700', c: '#a05a1a' });
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
  const x = 330, y = 50, w = 620, h = 620, s = G.stats;
  panel(x, y, w, h);
  T(G.endReason === 'faint' ? 'KAMU PINGSAN!' : 'WARUNG TUTUP', x + w / 2, y + 62, { s: 36, a: 'center', c: G.endReason === 'faint' ? '#b3281e' : '#6b3a14', stroke: '#fff3c8', sw: 2 });
  T(`Rekap Hari ${G.day}`, x + w / 2, y + 90, { s: 16, a: 'center', c: '#7a5a3a', w: '600' });
  const rows = [
    ['Pelanggan dilayani', s.served], ['Pelanggan kecewa', s.left], ['Omzet penjualan', rp(s.revenue)],
    ['Laba kotor', rp(s.profit)], ['Tip', rp(s.tips)], ['Belanja stok & promo', '-' + rp(s.spent)],
    ['Bonus misi & level', '+' + rp(s.bonus)], ['XP didapat · Level ' + level() + ' ' + rankOf(level()), '+' + (s.xp || 0)], ['Kasbon baru', rp(s.kasbonNew)],
  ];
  if (G.endReason === 'faint') rows.splice(7, 0, ['Biaya klinik', '-Rp 15.000']);
  rows.forEach((r, i) => {
    const ry = y + 112 + i * 36; ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.6)'; rr(ctx, x + 30, ry, w - 60, 32, 8); ctx.fill();
    T(r[0], x + 46, ry + 22, { s: 16, c: '#3a210c' }); T(String(r[1]), x + w - 46, ry + 22, { s: 17, a: 'right', c: String(r[1]).startsWith('-') ? '#b3281e' : '#2a6a2a' });
  });
  const by = y + 112 + rows.length * 36 + 10;
  SP('coin', x + 60, by + 26, .9, .5, .5);
  T('SALDO', x + 96, by + 18, { s: 12, c: '#7a5a3a' }); T(rp(G.money), x + 96, by + 44, { s: 30, c: '#b87a14', stroke: '#fff3c8', sw: 2 });
  T(`Target juragan: ${rp(WIN_GOAL)}`, x + w - 40, by + 20, { s: 13, a: 'right', c: '#7a5a3a' });
  ctx.fillStyle = '#d8c28c'; rr(ctx, x + w - 250, by + 28, 210, 12, 6); ctx.fill(); ctx.fillStyle = '#58b948'; rr(ctx, x + w - 250, by + 28, Math.max(8, 210 * clamp(G.money / WIN_GOAL, 0, 1)), 12, 6); ctx.fill();
  const debt = G.debts.reduce((q, d) => q + d.amount, 0) + 0;
  if (debt) T(`Kasbon beredar: ${rp(debt)}`, x + 46, by + 76, { s: 14, c: '#7a3a1a' });
  button(x + 60, y + h - 80, 230, 54, 'HP · PESAN BARANG', () => { ui.modal = 'phone'; }, { col: 'wood', s: 17 });
  button(x + w - 290, y + h - 80, 230, 54, 'TIDUR → HARI ' + (G.day + 1), nextDay, { col: 'green', s: 18 });
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
  const x = 440, y = 120, w = 400, h = 460; panel(x, y, w, h);
  T('JEDA', x + w / 2, y + 60, { s: 36, a: 'center', c: '#6b3a14' });
  button(x + 50, y + 90, w - 100, 52, 'LANJUT', () => { ui.modal = null; }, { col: 'green' });
  button(x + 50, y + 156, w - 100, 46, 'Suara: ' + (G.sound ? 'NYALA' : 'MATI'), () => { G.sound = !G.sound; save(); }, { col: 'blue', s: 16 });
  button(x + 50, y + 214, w - 100, 46, featureOn('auto') ? 'Kembalian otomatis: ' + (G.auto ? 'ON' : 'OFF') : `Kembalian otomatis: Level ${FEATURE_LVL.auto}`, () => { G.auto = !G.auto; save(); }, { col: G.auto ? 'green' : 'grey', s: 15, disabled: !featureOn('auto') });
  button(x + 50, y + 272, w - 100, 46, 'CARA MAIN', () => { ui.modal = 'help'; }, { col: 'wood', s: 16 });
  button(x + 50, y + 330, w - 100, 46, 'MENU UTAMA', () => { save(); ui.modal = null; G.screen = 'title'; ui.hasSave = !!loadSave(); }, { col: 'red', s: 16 });
  T('Kemajuan tersimpan tiap akhir hari.', x + w / 2, y + 410, { s: 13, a: 'center', c: '#7a5a3a', w: '600' });
}
export function winModal() {
  const x = 340, y = 150, w = 600, h = 400; panel(x, y, w, h);
  SP('piala', x + w / 2, y + 100, 2, .5, .5);
  T('JURAGAN SUKSES!', x + w / 2, y + 220, { s: 40, a: 'center', c: '#b87a14', stroke: '#fff3c8', sw: 3 });
  T(`Saldo warungmu tembus ${rp(WIN_GOAL)}.`, x + w / 2, y + 258, { s: 18, a: 'center', c: '#3a210c', w: '600' });
  T('Kamu boleh terus main — kejar rekor!', x + w / 2, y + 286, { s: 15, a: 'center', c: '#7a5a3a', w: '600' });
  button(x + w / 2 - 110, y + 320, 220, 54, 'LANJUT MAIN', () => { ui.modal = null; }, { col: 'green' });
}

