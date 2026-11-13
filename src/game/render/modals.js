import { ngobrolModal } from './social.js';
import { SFX } from '../audio.js';
import { H, W, WIN_GOAL } from '../constants.js';
import { BY, ITEMS } from '../data.js';
import { ctx } from '../gfx.js';
import { ico } from '../icons.js';
import { cycleQuality, qualityLabel } from '../quality.js';
import { BONUS_COST, candidates, canHire, fire, giveBonus, hire, slots, staffList, wageOf, wagesPerDay } from '../logic/staff.js';
import { FRIDGE_COST, buyFridge, expiringSoon, freshUnits, oldestLeft, perishables, shelfOf } from '../logic/freshness.js';
import { favItems, regState, regTier, tierName } from '../logic/regulars.js';
import { REGULARS, ROLES, TIER_AT } from '../story/regulars.js';
import { ATLAS } from '../atlas.js';
import { TYPES } from '../data.js';
import { TYPE_LVL, typeOn } from '../logic/level.js';
import { ageOf, askedToday, chances, collect, forgive, kasbonLimit, outstanding, overdue } from '../logic/kasbon.js';
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
  else if (ui.modal === 'kasbon') kasbonModal();
  else if (ui.modal === 'regulars') regularsModal();
  else if (ui.modal === 'kulkas') kulkasModal();
  else if (ui.modal === 'staff') staffModal();
  else if (ui.modal === 'ngobrol') ngobrolModal();
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
  if (featureOn('karyawan')) button(x + w - 720, y + 22, 180, 40, 'KARYAWAN' + (staffList().length ? ` (${staffList().length})` : ''), () => { ui.modal = 'staff'; }, { col: 'yellow', tc: '#4a2a00', s: 15, tip: 'Rekrut & kelola karyawan' });
  button(x + w - 530, y + 22, 180, 40, 'GUDANG', () => { ui.modal = 'kulkas'; }, { col: 'blue', s: 15, tip: 'Umur stok & kulkas' });
  button(x + w - 330, y + 22, 250, 40, 'PELANGGAN TETAP', () => { ui.modal = 'regulars'; ui.regPage = 0; }, { col: 'wood', s: 15, tip: 'Kedekatan & kesukaan pelanggan tetap' });
  T('Cek stok & harga. Untuk memesan barang ke grosir, pakai HP.', x + 36, y + 80, { s: 14, w: '600', c: '#7a5a3a' });
  closeBtn(x + w - 36, y + 38, () => { ui.modal = null; });
  const PER_N = 12, pagesN = Math.ceil(ITEMS.length / PER_N); ui.notePage = Math.min(ui.notePage || 0, pagesN - 1);
  if (pagesN > 1) {
    button(x + w - 250, y + 66, 44, 30, '◀', () => { ui.notePage = (ui.notePage + pagesN - 1) % pagesN; }, { col: 'wood', s: 14 });
    T(`${ui.notePage + 1}/${pagesN}`, x + w - 190, y + 88, { s: 15, a: 'center', c: '#5a3a1a' });
    button(x + w - 160, y + 66, 44, 30, '▶', () => { ui.notePage = (ui.notePage + 1) % pagesN; }, { col: 'wood', s: 14 });
  }
  ITEMS.slice(ui.notePage * PER_N, ui.notePage * PER_N + PER_N).forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2), rx = x + 30 + col * 500, ry = y + 100 + row * 66;
    ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, rx, ry, 480, 58, 10); ctx.fill(); ctx.strokeStyle = '#d6bf8a'; ctx.lineWidth = 2; ctx.stroke();
    ico(it.id, rx + 8, ry + 5, 48);
    T(it.name, rx + 66, ry + 24, { s: 16, c: '#3a210c' });
    T(`jual ${rp(it.price)} · modal ${rp(Math.round(it.cost))}/pcs · laba ${rp(Math.round(it.price - it.cost))}`, rx + 66, ry + 44, { s: 12, w: '600', c: '#7a5a3a' });
    const n = G.stock[it.id] || 0;
    if (!itemOn(it.id)) { ctx.fillStyle = 'rgba(225,220,205,.8)'; rr(ctx, rx, ry, 480, 58, 10); ctx.fill(); T(`Terkunci · buka di Level ${ITEM_LVL[it.id]}`, rx + 462, ry + 36, { s: 15, a: 'right', c: '#a05a1a' }); return; }
    T(`stok ${n}`, rx + 462, ry + 30, { s: 20, a: 'right', c: n <= 2 ? '#c0392b' : '#3a6a2a' });
    const left = n > 0 ? oldestLeft(it.id) : null; if (left !== null) T(left <= 0 ? 'basi hari ini' : `segar ${left} hari`, rx + 462, ry + 50, { s: 12, a: 'right', w: '700', c: left <= 2 ? '#c0392b' : '#7a6a4a' });
  });
  const by = y + h - 130;
  T('Uang kas: ' + rp(G.money), x + 36, by + 28, { s: 18, c: '#5a3a1a' });
  const debt = G.debts.reduce((s, d) => s + d.amount, 0);
  T(`Kasbon beredar: ${rp(debt)} (${G.debts.length})`, x + 36, by + 54, { s: 14, w: '600', c: '#7a3a1a' });
  const pend = G.deliveries.length ? 'Dalam perjalanan: ' + G.deliveries.map(d => Object.entries(d.items).map(([k, v]) => `${v} ${BY[k].name}`).join(', ')).join(' | ') : '';
  if (pend) T(pend.length > 100 ? pend.slice(0, 98) + '…' : pend, x + 36, by + 80, { s: 12, w: '600', c: '#3a5a8a' });
  { const st = story(); T(st.easy ? 'Mode santai: tanpa cicilan' : st.lunas ? 'Utang ke Koh Awi lunas' : `Utang Koh Awi ${rp(st.debt)} · cicilan hari ke-${st.due}: ${rp(installment())}`, x + 36, by + 106, { s: 13, w: '700', c: '#7a3a1a' });
    if (!st.lunas && st.debt > 0) button(x + w - 550, by + 18, 180, 54, 'BAYAR UTANG', () => payDebt(50000), { col: 'blue', s: 15, disabled: G.money < Math.min(50000, st.debt), tip: 'Bayar Rp 50.000 ke Koh Awi lebih awal' }); }
  button(x + w - 730, by + 18, 170, 54, 'KASBON' + (G.debts.length ? ` (${G.debts.length})` : ''), () => { ui.modal = 'kasbon'; ui.kasbonPage = 0; }, { col: G.debts.some(overdue) ? 'red' : 'yellow', tc: G.debts.some(overdue) ? '#fff' : '#4a2a00', s: 15, tip: 'Daftar kasbon & penagihan' });
  button(x + w - 360, by + 18, 200, 54, 'PESAN LEWAT HP', () => { ui.modal = 'phone'; }, { col: 'green', s: 17 });
  button(x + w - 150, by + 18, 120, 54, 'TUTUP', () => { ui.modal = null; }, { col: 'wood', s: 18 });
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
/** Karyawan: rekrut dari pelanggan tetap yang Akrab, gaji, kesetiaan. */
export function staffModal() {
  const x = 190, y = 36, w = 900, h = 648, list = staffList(), sl = slots();
  panel(x, y, w, h);
  T('KARYAWAN', x + 36, y + 56, { s: 32, c: '#6b3a14' });
  closeBtn(x + w - 40, y + 40, () => { ui.modal = 'notebook'; });
  T(`Kursi ${list.length}/${sl} (Lv 7: 1 · Lv 10: 2) · gaji ${rp(wagesPerDay())}/hari, dibayar saat warung tutup`, x + 36, y + 84, { s: 14, w: '700', c: '#5a3a1a' });
  T('KARYAWANMU', x + 36, y + 114, { s: 13, w: '800', c: '#a05a1a' });
  if (!list.length) T('Belum ada. Rekrut pelanggan tetap yang sudah Akrab di bawah.', x + 56, y + 150, { s: 15, w: '600', c: '#7a6a5a' });
  list.forEach((e, i) => {
    const r = REGULARS.find(q => q.id === e.id), role = ROLES[r.job], ry = y + 122 + i * 82, lazy = e.loyalty < 30, a = ATLAS[TYPES[r.type].spr];
    ctx.fillStyle = lazy ? 'rgba(230,150,130,.35)' : 'rgba(120,200,110,.25)'; rr(ctx, x + 28, ry, w - 56, 74, 10); ctx.fill(); ctx.strokeStyle = lazy ? '#d88a7a' : '#7ac070'; ctx.lineWidth = 2; ctx.stroke();
    if (a) SP(TYPES[r.type].spr, x + 66, ry + 70, 62 / a[3], .5, 1);
    T(`${r.name} · ${role.name}`, x + 110, ry + 26, { s: 18, c: '#3a210c' });
    T(lazy ? 'Malas — perannya tidak aktif. Beri bonus atau bayar gaji tepat waktu.' : role.desc, x + 110, ry + 46, { s: 12, w: '600', c: lazy ? '#b3281e' : '#2a5a1a' });
    ctx.fillStyle = '#d8c28c'; rr(ctx, x + 110, ry + 54, 160, 9, 5); ctx.fill(); ctx.fillStyle = e.loyalty >= 60 ? '#58b948' : e.loyalty >= 30 ? '#e0b030' : '#d6483a'; rr(ctx, x + 110, ry + 54, Math.max(5, 160 * e.loyalty / 100), 9, 5); ctx.fill();
    T(`Kesetiaan ${Math.round(e.loyalty)} · gaji ${rp(wageOf(e.id))}/hari${e.owed ? ` · tunggakan ${rp(e.owed)}` : ''}`, x + 282, ry + 63, { s: 12, w: '700', c: e.owed ? '#b3281e' : '#5a3a1a' });
    button(x + w - 330, ry + 14, 150, 46, `BONUS ${Math.round(BONUS_COST / 1000)}rb`, () => giveBonus(e.id), { col: 'green', s: 14, disabled: G.money < BONUS_COST, tip: 'Kesetiaan +15, kedekatan +3' });
    button(x + w - 170, ry + 14, 130, 46, 'PECAT', () => fire(e.id), { col: 'red', s: 15 });
  });
  const cy = y + 122 + Math.max(1, sl) * 82 + 12;
  T('BISA DIREKRUT (pelanggan tetap yang sudah Akrab)', x + 36, cy, { s: 13, w: '800', c: '#a05a1a' });
  const cand = candidates();
  if (!featureOn('karyawan')) T(`Karyawan terbuka di Level ${FEATURE_LVL.karyawan}.`, x + 56, cy + 40, { s: 16, w: '700', c: '#a05a1a' });
  else if (!cand.length) T('Belum ada. Layani pelanggan tetap sampai Akrab (lihat Pelanggan Tetap).', x + 56, cy + 40, { s: 15, w: '600', c: '#7a6a5a' });
  cand.slice(0, 4).forEach((r, i) => {
    const ry = cy + 12 + i * 62, ok = canHire(r.id), role = ROLES[r.job];
    ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, x + 28, ry, w - 56, 56, 10); ctx.fill(); ctx.strokeStyle = '#d6bf8a'; ctx.lineWidth = 2; ctx.stroke();
    T(`${r.name} → ${role.name}`, x + 48, ry + 24, { s: 17, c: '#3a210c' });
    T(`${role.desc}  Gaji ${rp(role.wage)}/hari.`, x + 48, ry + 44, { s: 12, w: '600', c: '#5a3a1a' });
    button(x + w - 200, ry + 6, 160, 44, 'REKRUT', () => hire(r.id), { col: 'green', s: 16, disabled: !ok, tip: ok ? 'Mulai bekerja besok' : 'Kursi penuh' });
  });
  T('Pelanggan yang bekerja tidak lagi datang sebagai pembeli.', x + 36, y + h - 20, { s: 12, w: '600', c: '#7a5a3a' });
}
/** Gudang: umur stok barang yang bisa basi + kulkas. */
export function kulkasModal() {
  const x = 190, y = 36, w = 900, h = 648;
  panel(x, y, w, h);
  T('GUDANG & KULKAS', x + 36, y + 56, { s: 32, c: '#6b3a14' });
  closeBtn(x + w - 40, y + 40, () => { ui.modal = 'notebook'; });
  T('Barang bisa basi. Yang tertua dijual lebih dulu; yang lewat masa simpan dibuang tiap pagi.', x + 36, y + 84, { s: 13, w: '600', c: '#7a5a3a' });
  perishables().forEach((it, i) => {
    const ry = y + 104 + i * 64, n = G.stock[it.id] || 0, on = itemOn(it.id), shelf = shelfOf(it.id), left = on && n > 0 ? oldestLeft(it.id) : null, soon = on ? expiringSoon(it.id) : 0;
    ctx.fillStyle = on ? 'rgba(255,255,255,.55)' : 'rgba(225,220,205,.7)'; rr(ctx, x + 28, ry, w - 56, 58, 10); ctx.fill(); ctx.strokeStyle = soon ? '#d88a7a' : '#d6bf8a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = on ? 1 : .35; ico(it.id, x + 38, ry + 7, 44); ctx.globalAlpha = 1;
    T(it.name, x + 96, ry + 26, { s: 18, c: on ? '#3a210c' : '#8a7a6a' });
    if (!on) { T(`Terkunci · Level ${ITEM_LVL[it.id]}`, x + 96, ry + 46, { s: 12, w: '700', c: '#a05a1a' }); return; }
    T(`masa simpan ${shelf} hari · stok ${n}`, x + 96, ry + 46, { s: 12, w: '600', c: '#5a3a1a' });
    // bar kesegaran: tiap kelompok = satu segmen (kiri = tertua)
    const bx = x + 360, bw = 340; ctx.fillStyle = '#d8c28c'; rr(ctx, bx, ry + 18, bw, 16, 8); ctx.fill();
    let px = bx; const total = freshUnits(it.id).reduce((q, u) => q + u.n, 0) || 1;
    for (const u of freshUnits(it.id)) { const ww = Math.max(4, bw * u.n / total); ctx.fillStyle = u.left <= 2 ? '#d6483a' : u.left <= shelf * .4 ? '#e0b030' : '#58b948'; ctx.fillRect(px, ry + 18, Math.min(ww, bx + bw - px), 16); px += ww; }
    ctx.strokeStyle = '#6b4a22'; ctx.lineWidth = 2; rr(ctx, bx, ry + 18, bw, 16, 8); ctx.stroke();
    T(n === 0 ? 'kosong' : left <= 0 ? 'basi besok pagi' : `tertua ${left} hari lagi`, bx + bw + 14, ry + 31, { s: 13, w: '700', c: soon ? '#b3281e' : '#5a3a1a' });
    if (soon) T(`${soon} unit hampir basi`, bx, ry + 52, { s: 12, w: '800', c: '#b3281e' });
  });
  const fy = y + 104 + perishables().length * 64 + 8;
  ctx.fillStyle = G.fridge ? 'rgba(120,200,110,.35)' : 'rgba(255,255,255,.55)'; rr(ctx, x + 28, fy, w - 56, 78, 12); ctx.fill(); ctx.strokeStyle = G.fridge ? '#5aa84a' : '#d6bf8a'; ctx.lineWidth = 2; ctx.stroke();
  T('KULKAS', x + 48, fy + 32, { s: 20, c: '#2a4a6a' });
  if (G.fridge) T('Terpasang: masa simpan semua barang ×2.', x + 48, fy + 58, { s: 15, w: '700', c: '#2a6a1a' });
  else {
    T(featureOn('kulkas') ? 'Gandakan masa simpan semua barang yang bisa basi.' : `Terbuka di Level ${FEATURE_LVL.kulkas}.`, x + 48, fy + 58, { s: 14, w: '600', c: '#5a3a1a' });
    button(x + w - 330, fy + 14, 280, 50, `BELI ${rp(FRIDGE_COST)}`, buyFridge, { col: 'green', s: 18, disabled: !featureOn('kulkas') || G.money < FRIDGE_COST });
  }
  T(`Kerugian stok basi hari ini: ${rp((G.stats && G.stats.waste) || 0)}`, x + 36, y + h - 20, { s: 13, w: '700', c: '#7a3a1a' });
}
/** Buku pelanggan tetap: kedekatan, kesukaan, kunjungan, utang. */
export function regularsModal() {
  const x = 150, y = 36, w = 980, h = 648, PER = 6, CW = 450, CH = 124;
  panel(x, y, w, h);
  T('PELANGGAN TETAP', x + 36, y + 56, { s: 32, c: '#6b3a14' });
  closeBtn(x + w - 40, y + 40, () => { ui.modal = 'notebook'; });
  T('Layani dengan baik agar makin akrab: lebih sabar, lebih sering memberi tip, dan ada hadiah saat jadi Sahabat.', x + 36, y + 86, { s: 13, w: '600', c: '#7a5a3a' });
  const pages = Math.ceil(REGULARS.length / PER); ui.regPage = clamp(ui.regPage || 0, 0, pages - 1);
  REGULARS.slice(ui.regPage * PER, ui.regPage * PER + PER).forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2), cx = x + 30 + col * (CW + 20), cy = y + 104 + row * (CH + 10), on = typeOn(r.type), st = regState(r.id), tier = regTier(r.id);
    ctx.fillStyle = on ? 'rgba(255,255,255,.55)' : 'rgba(225,220,205,.7)'; rr(ctx, cx, cy, CW, CH, 12); ctx.fill(); ctx.strokeStyle = on ? ['#c8c2b0', '#8ab8e0', '#7ac070', '#e0b030'][tier] : '#d6cdb8'; ctx.lineWidth = 3; ctx.stroke();
    const a = ATLAS[TYPES[r.type].spr]; if (a) { ctx.globalAlpha = on ? 1 : .35; SP(TYPES[r.type].spr, cx + 44, cy + CH - 12, 78 / a[3], .5, 1); ctx.globalAlpha = 1; }
    if (!on) { T(r.name, cx + 100, cy + 36, { s: 19, c: '#8a7a6a' }); T(`Belum dikenal · muncul di Level ${TYPE_LVL[r.type]}`, cx + 100, cy + 62, { s: 14, w: '700', c: '#a05a1a' }); return; }
    T(r.name, cx + 100, cy + 32, { s: 20, c: '#3a210c' });
    if (staffList().some(e => e.id === r.id)) T('KARYAWAN', cx + CW - 16, cy + 12, { s: 10, a: 'right', w: '800', c: '#2a6a1a' });
    T(`${'★'.repeat(tier)}${'☆'.repeat(3 - tier)} ${tierName(tier)}`, cx + CW - 16, cy + 32, { s: 15, a: 'right', c: ['#8a8a8a', '#3a7ab8', '#2a8a2a', '#b88a10'][tier] });
    const nxt = TIER_AT[tier + 1], lo = TIER_AT[tier], f = nxt === undefined ? 1 : (st.aff - lo) / (nxt - lo);
    ctx.fillStyle = '#d8c28c'; rr(ctx, cx + 100, cy + 42, 200, 10, 5); ctx.fill(); ctx.fillStyle = ['#aab', '#5aa6e8', '#58b948', '#e0b030'][tier]; rr(ctx, cx + 100, cy + 42, Math.max(6, 200 * f), 10, 5); ctx.fill();
    T(nxt === undefined ? 'maks.' : `${Math.round(st.aff)}/${nxt}`, cx + 310, cy + 52, { s: 12, w: '700', c: '#5a3a1a' });
    T('Suka:', cx + 100, cy + 80, { s: 12, w: '700', c: '#7a5a3a' });
    favItems(r).slice(0, 4).forEach((id, k) => { ctx.globalAlpha = itemOn(id) ? 1 : .35; ico(id, cx + 140 + k * 30, cy + 62, 26); ctx.globalAlpha = 1; });
    const owed = G.debts.filter(d => d.who === r.name).reduce((q, d) => q + d.amount, 0);
    T(st.visits ? `${st.visits}× datang · ${st.last === G.day ? 'hari ini' : `hari ke-${st.last}`}` : 'Belum pernah datang', cx + 100, cy + 108, { s: 12, w: '600', c: '#5a3a1a' });
    if (owed) T(`Kasbon ${rp(owed)}`, cx + CW - 16, cy + 108, { s: 13, a: 'right', w: '700', c: '#b3281e' });
    if (st.gift) T('★ hadiah Sahabat diterima', cx + CW - 16, cy + 80, { s: 11, a: 'right', w: '700', c: '#b88a10' });
  });
  if (pages > 1) {
    button(x + 40, y + h - 66, 190, 46, '◀ Sebelumnya', () => { ui.regPage--; }, { col: 'grey', s: 15, disabled: ui.regPage <= 0 });
    T(`${ui.regPage + 1}/${pages}`, x + w / 2, y + h - 36, { s: 16, a: 'center', c: '#555', w: '700' });
    button(x + w - 230, y + h - 66, 190, 46, 'Berikutnya ▶', () => { ui.regPage++; }, { col: 'grey', s: 15, disabled: ui.regPage >= pages - 1 });
  }
}
/** Daftar kasbon & penagihan. */
export function kasbonModal() {
  const x = 190, y = 36, w = 900, h = 648, PER = 5, RH = 78;
  panel(x, y, w, h);
  T('DAFTAR KASBON', x + 36, y + 56, { s: 32, c: '#6b3a14' });
  closeBtn(x + w - 40, y + 40, () => { ui.modal = 'notebook'; });
  const out = outstanding(), lim = kasbonLimit();
  T(`Beredar ${rp(out)} dari batas ${rp(lim)} · ${G.debts.length} catatan`, x + 36, y + 86, { s: 15, w: '700', c: out > lim * .85 ? '#b3281e' : '#5a3a1a' });
  ctx.fillStyle = '#d8c28c'; rr(ctx, x + w - 330, y + 74, 280, 12, 6); ctx.fill();
  ctx.fillStyle = out > lim * .85 ? '#d6483a' : '#58b948'; rr(ctx, x + w - 330, y + 74, Math.max(6, 280 * Math.min(1, out / lim)), 12, 6); ctx.fill();
  T('Tagih sekali sehari per catatan. Halus: aman, peluang sedang. Keras: peluang tinggi tapi merusak kepercayaan. Ikhlaskan: hapus catatan.', x + 36, y + 112, { s: 12, w: '600', c: '#7a5a3a' });
  const list = [...G.debts].sort((a, b) => ageOf(b) - ageOf(a)), pages = Math.max(1, Math.ceil(list.length / PER));
  ui.kasbonPage = clamp(ui.kasbonPage || 0, 0, pages - 1);
  if (!list.length) T('Tidak ada kasbon beredar. Semua lunas!', x + w / 2, y + 300, { s: 24, a: 'center', c: '#2a6a2a' });
  list.slice(ui.kasbonPage * PER, ui.kasbonPage * PER + PER).forEach((d, i) => {
    const ry = y + 128 + i * RH, od = overdue(d), asked = askedToday(d), ch = chances(d);
    ctx.fillStyle = od ? 'rgba(230,150,130,.35)' : 'rgba(255,255,255,.55)'; rr(ctx, x + 28, ry, w - 56, RH - 8, 10); ctx.fill(); ctx.strokeStyle = od ? '#d88a7a' : '#d6bf8a'; ctx.lineWidth = 2; ctx.stroke();
    T(d.who, x + 48, ry + 36, { s: 21, c: '#3a210c' });
    T(rp(d.amount), x + 48 + Math.min(260, 20 + d.who.length * 11), ry + 36, { s: 19, c: '#2a6a2a' });
    if (od) T('JATUH TEMPO — bisa macet besok', x + 48, ry + 15, { s: 11, w: '800', c: '#b3281e' });
    T(asked ? `Hari ke-${Math.max(1, ageOf(d))} · sudah ditagih hari ini` : `Hari ke-${Math.max(1, ageOf(d))} · peluang halus ${Math.round(ch.soft * 100)}% · keras ${Math.round(ch.hard * 100)}%`, x + 48, ry + 58, { s: 13, w: '600', c: '#5a3a1a' });
    button(x + w - 420, ry + 12, 110, 46, 'TAGIH', () => collect(d, false), { col: 'green', s: 16, disabled: asked, tip: 'Tagih dengan baik-baik' });
    button(x + w - 300, ry + 12, 110, 46, 'KERAS', () => collect(d, true), { col: 'red', s: 16, disabled: asked, tip: 'Tagih keras: peluang tinggi, kepercayaan turun' });
    button(x + w - 180, ry + 12, 150, 46, 'IKHLASKAN', () => forgive(d), { col: 'blue', s: 15, tip: 'Hapus catatan, kepercayaan naik' });
  });
  if (pages > 1) {
    button(x + 40, y + h - 96, 190, 46, '◀ Sebelumnya', () => { ui.kasbonPage--; }, { col: 'grey', s: 15, disabled: ui.kasbonPage <= 0 });
    T(`${ui.kasbonPage + 1}/${pages}`, x + w / 2, y + h - 66, { s: 16, a: 'center', c: '#555', w: '700' });
    button(x + w - 230, y + h - 96, 190, 46, 'Berikutnya ▶', () => { ui.kasbonPage++; }, { col: 'grey', s: 15, disabled: ui.kasbonPage >= pages - 1 });
  }
  T('Kasbon yang tidak ditagih bisa dibayar sendiri tiap pagi, atau macet setelah 3 hari.', x + 36, y + h - 24, { s: 12, w: '600', c: '#7a5a3a' });
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
    ['Laba kotor', rp(s.profit)], ['Tip', rp(s.tips)], ['Belanja, gaji & promo', '-' + rp(s.spent)],
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

