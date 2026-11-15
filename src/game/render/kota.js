import { ctx } from '../gfx.js';
import { BIZ, BIZ_MAX, CAMP_ACTS, CAMP_DAYS, CITY_DAYS, IND, MAX_PROJ, PROJECTS, RIVAL, WIN_WEALTH } from '../story/kota.js';
import { assetValue, bizIncAt, bizLevel, bizNextCost, build, buyBiz, campUses, campaign, canBuild, canRun, city, cityAvg, endingInfo, incomePerDay, isMiliarder, kota, netWorth, projectBusy, rivalPower, runForOffice, support, taxPerDay } from '../logic/kota.js';
import { story } from '../logic/story.js';
import { G, ui } from '../state.js';
import { T, clamp, rpk, rr, wrapText } from '../util.js';
import { button, panel } from '../widgets.js';
import { save } from '../persist.js';
import { closeBtn } from './modals.js';

const bar = (x, y, w, h, v, col, back = '#d8c28c') => { ctx.fillStyle = back; rr(ctx, x, y, w, h, h / 2); ctx.fill(); if (v > 0) { ctx.fillStyle = col; rr(ctx, x, y, Math.max(h, w * clamp(v, 0, 1)), h, h / 2); ctx.fill(); } };
const card = (x, y, w, h, fill = 'rgba(255,255,255,.55)', line = '#d6bf8a') => { ctx.fillStyle = fill; rr(ctx, x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.stroke(); };
const fxText = fx => Object.entries(fx).map(([k, v]) => `${IND[k].split(' ')[0]} ${v > 0 ? '+' : ''}${v}`).join(' · ');

/** Menu USAHA & KOTA: tab usaha, dan tab politik/kota sesuai babak. */
export function kotaModal() {
  const k = kota(), x = 110, y = 20, w = 1060, h = 680; panel(x, y, w, h);
  const wali = k.phase === 'wali';
  T('USAHA & KOTA', x + 36, y + 54, { s: 32, c: '#6b3a14' });
  closeBtn(x + w - 40, y + 40, () => { ui.modal = null; save(); });
  T(`Kekayaan bersih ${rpk(netWorth())}  ·  Kas ${rpk(G.money)}  ·  Aset ${rpk(assetValue())}  ·  Pendapatan usaha ${rpk(incomePerDay())}/hari`, x + 36, y + 82, { s: 14, w: '700', c: '#5a3a1a' });
  [['usaha', 'USAHA'], ['politik', wali ? 'KOTA' : 'POLITIK']].forEach(([id, label], i) => {
    button(x + 36 + i * 170, y + 96, 160, 40, label, () => { k.tab = id; }, { col: k.tab === id ? 'yellow' : 'wood', tc: k.tab === id ? '#4a2a00' : '#fff', s: 16 });
  });
  if (k.tab === 'politik') (wali ? kotaTab : politikTab)(k, x, y + 150, w); else usahaTab(k, x, y + 150, w);
}

function usahaTab(k, x, y, w) {
  const pr = netWorth() / WIN_WEALTH;
  T('Target miliarder', x + 36, y + 14, { s: 13, w: '800', c: '#a05a1a' });
  bar(x + 36, y + 22, w - 72, 14, pr, isMiliarder() ? '#e0b030' : '#58b948');
  T(`${rpk(netWorth())} / ${rpk(WIN_WEALTH)}`, x + w - 40, y + 14, { s: 13, a: 'right', w: '700', c: '#5a3a1a' });
  BIZ.forEach((b, i) => {
    const ry = y + 52 + i * 98, lv = bizLevel(b.id), nx = bizNextCost(b.id), inc = bizIncAt(b, lv), gain = bizIncAt(b, lv + 1) - inc;
    card(x + 28, ry, w - 56, 90, lv ? 'rgba(120,200,110,.22)' : 'rgba(255,255,255,.55)', lv ? '#7ac070' : '#d6bf8a');
    T(b.name, x + 52, ry + 32, { s: 22, c: '#3a210c' });
    T(b.desc, x + 52, ry + 54, { s: 13, w: '600', c: '#5a3a1a' });
    for (let p = 0; p < BIZ_MAX; p++) { ctx.fillStyle = p < lv ? '#e0b030' : '#d8c28c'; rr(ctx, x + 52 + p * 30, ry + 64, 24, 12, 4); ctx.fill(); }
    T(lv ? `Lv ${lv} · ${rpk(inc)}/hari` : 'Belum dibuka', x + 440, ry + 32, { s: 17, w: '800', c: lv ? '#2a5a1a' : '#7a6a5a' });
    if (nx !== null) T(`${lv ? 'Naik' : 'Buka'}: +${rpk(gain)}/hari  ·  balik modal ~${Math.ceil(nx / gain)} hari`, x + 440, ry + 56, { s: 13, w: '700', c: '#5a3a1a' });
    else T('Level maksimum', x + 440, ry + 56, { s: 13, w: '700', c: '#5a3a1a' });
    button(x + w - 250, ry + 20, 190, 52, nx === null ? 'MAKS' : `${lv ? 'NAIK' : 'BUKA'} ${rpk(nx)}`, () => buyBiz(b.id), { col: 'green', s: 17, disabled: nx === null || G.money < nx, tip: nx !== null && G.money < nx ? 'Kas belum cukup' : 'Pendapatan masuk tiap pagi' });
  });
  T('Pendapatan usaha masuk ke kas tiap pagi. Aset dihitung 70% dari modal untuk kekayaan bersih.', x + 36, y + 52 + BIZ.length * 98 + 12, { s: 13, w: '600', c: '#7a5a3a' });
}

function politikTab(k, x, y, w) {
  const s = story(), sup = support(), kamp = k.phase === 'kampanye';
  if (k.ch < 7) { T('Terbuka setelah kekayaan bersihmu menembus Rp 1 miliar (tab USAHA).', x + 40, y + 50, { s: 18, w: '700', c: '#7a6a5a' }); return; }
  T('DUKUNGAN WARGA', x + 36, y + 14, { s: 13, w: '800', c: '#a05a1a' });
  bar(x + 36, y + 24, w - 72, 18, sup / 100, sup >= rivalPower() ? '#58b948' : '#e0b030');
  const rx = x + 36 + (w - 72) * rivalPower() / 100; ctx.fillStyle = '#b3281e'; ctx.fillRect(rx - 2, y + 18, 4, 30);
  T(`Dukunganmu ${sup}  ·  ${RIVAL} ${rivalPower()}  ·  Integritas ${Math.round(k.integ)}`, x + 36, y + 62, { s: 14, w: '700', c: '#5a3a1a' });
  if (!kamp) {
    const ok = [[isMiliarder(), 'Kekayaan bersih ≥ Rp 1 miliar'], [!!s.flags.diminta_calon, 'Warga memintamu maju (kejadian "Pak RT & warga")'], [s.trust >= 55, `Kepercayaan warga ≥ 55 (sekarang ${Math.round(s.trust)})`], [G.day - k.lostDay >= 5, 'Tidak sedang masa istirahat setelah kalah']];
    ok.forEach(([v, t], i) => T(`${v ? '✔' : '✖'}  ${t}`, x + 56, y + 108 + i * 30, { s: 17, w: '700', c: v ? '#2a5a1a' : '#9a3a2a' }));
    if (k.lost) T(`Pernah kalah ${k.lost}×. Simpati warga +${k.sympathy}.`, x + 56, y + 240, { s: 14, w: '600', c: '#7a5a3a' });
    button(x + w / 2 - 190, y + 280, 380, 64, 'MENCALONKAN DIRI', () => runForOffice(), { col: 'green', s: 24, disabled: !canRun(), tip: canRun() ? 'Kampanye 7 hari, lalu pemilihan' : 'Penuhi syarat di atas' });
    T('Pemilihan berlangsung 7 hari setelah kamu mendaftar. Dukungan awal ditentukan kepercayaan, reputasi, dan kebaikanmu pada warga.', x + 56, y + 372, { s: 13, w: '600', c: '#7a5a3a' });
    return;
  }
  T(`Hari kampanye ${Math.min(k.camp.day + 1, CAMP_DAYS)}/${CAMP_DAYS} — pemilihan di pagi hari ke-${CAMP_DAYS + 1}`, x + 36, y + 90, { s: 16, w: '800', c: '#6b3a14' });
  CAMP_ACTS.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2), cx = x + 28 + col * ((w - 56) / 2 + 0), cw = (w - 56) / 2 - 8, cy = y + 112 + row * 118, used = campUses(a.id), left = a.max - used;
    card(cx, cy, cw, 108, a.dirty ? 'rgba(230,150,130,.3)' : 'rgba(255,255,255,.55)', a.dirty ? '#d88a7a' : '#d6bf8a');
    T(a.name, cx + 18, cy + 28, { s: 18, c: '#3a210c' });
    T(a.desc, cx + 18, cy + 48, { s: 12, w: '600', c: '#5a3a1a' });
    T(`Dukungan +${a.pts} · sisa ${left}×`, cx + 18, cy + 70, { s: 13, w: '800', c: '#2a5a1a' });
    button(cx + cw - 170, cy + 28, 152, 50, `${rpk(a.cost)}`, () => campaign(a.id), { col: a.dirty ? 'red' : 'green', s: 17, disabled: left <= 0 || G.money < a.cost, tip: left <= 0 ? 'Sudah habis' : G.money < a.cost ? 'Kas belum cukup' : '' });
  });
}

function kotaTab(k, x, y, w) {
  const c = city(); if (!c) return;
  T(`HARI ${Math.min(c.day, CITY_DAYS)}/${CITY_DAYS} MASA JABATAN  ·  Kas kota ${rpk(c.apbd)}  ·  Pajak ${rpk(taxPerDay())}/hari  ·  Integritas ${Math.round(k.integ)}`, x + 36, y + 14, { s: 14, w: '800', c: '#5a3a1a' });
  Object.keys(IND).forEach((id, i) => {
    const bx = x + 36 + i * 252, v = c.ind[id];
    T(IND[id], bx, y + 44, { s: 13, w: '800', c: '#a05a1a' }); bar(bx, y + 52, 230, 12, v / 100, v >= 60 ? '#58b948' : v >= 35 ? '#e0b030' : '#d6483a');
    T(String(Math.round(v)), bx + 236, y + 64, { s: 12, w: '700', c: '#5a3a1a' });
  });
  T(`Rata-rata ${cityAvg()} · proyek berjalan ${c.proj.length}/${MAX_PROJ}`, x + 36, y + 90, { s: 13, w: '700', c: '#7a5a3a' });
  PROJECTS.forEach((p, i) => {
    const col = i % 3, row = Math.floor(i / 3), cw = (w - 56 - 24) / 3, cx = x + 28 + col * (cw + 12), cy = y + 104 + row * 132;
    const done = c.done[p.id], busy = projectBusy(p.id), run = c.proj.find(q => q.id === p.id), can = canBuild(p.id);
    card(cx, cy, cw, 124, done ? 'rgba(120,200,110,.3)' : busy ? 'rgba(255,225,130,.4)' : 'rgba(255,255,255,.55)', done ? '#7ac070' : '#d6bf8a');
    T(p.name, cx + 14, cy + 26, { s: 16, c: '#3a210c' });
    T(`${rpk(p.cost)} · ${p.days} hari`, cx + 14, cy + 46, { s: 12, w: '700', c: '#5a3a1a' });
    T(fxText(p.fx), cx + 14, cy + 64, { s: 12, w: '700', c: '#2a5a1a' });
    if (done) T('✔ Selesai', cx + 14, cy + 100, { s: 16, w: '800', c: '#2a5a1a' });
    else if (busy) { T(`Dibangun… sisa ${run.left} hari`, cx + 14, cy + 100, { s: 14, w: '800', c: '#a05a1a' }); }
    else {
      button(cx + 12, cy + 76, cw - 24 - 96, 40, 'BANGUN', () => build(p.id), { col: 'green', s: 15, disabled: !can, tip: !can ? (c.proj.length >= MAX_PROJ ? 'Dinas PU penuh' : 'Kas kota belum cukup') : 'Anggaran bersih' });
      button(cx + cw - 92, cy + 76, 80, 40, 'MARK-UP', () => build(p.id, true), { col: 'red', s: 12, disabled: !can, tip: '+20% ke kantong pribadi. Integritas −12, 25% ketahuan.' });
    }
  });
}

/** Hasil pemilihan wali kota. */
export function pilkadaModal() {
  const r = kota().result; if (!r) { ui.modal = null; return; }
  const x = 290, y = 90, w = 700, h = 520; panel(x, y, w, h);
  T('HASIL PEMILIHAN', x + w / 2, y + 56, { s: 16, a: 'center', c: '#7a5a3a', w: '700' });
  T(r.win ? 'KAMU TERPILIH!' : 'BELUM BERUNTUNG', x + w / 2, y + 120, { s: 44, a: 'center', c: r.win ? '#b87a14' : '#9a3a2a', stroke: '#fff3c8', sw: 3 });
  bar(x + 80, y + 170, w - 160, 30, r.share / 100, r.win ? '#58b948' : '#d6483a', '#d6bf8a');
  T(`${r.share}% suara`, x + w / 2, y + 192, { s: 20, a: 'center', c: '#fff', stroke: 'rgba(0,0,0,.5)', sw: 3 });
  const msg = r.win ? `Warga memilihmu. Skor dukunganmu ${r.score} mengalahkan ${RIVAL} (${r.rival}). Pelantikan di pagi hari berikutnya... kota ini sekarang tanggung jawabmu.` : `Skor dukunganmu ${r.score}, ${RIVAL} ${r.rival}. Warga simpati: dukunganmu bertambah. Kamu boleh mencalonkan lagi 5 hari lagi.`;
  wrapText(msg, w - 120, 17, '600').forEach((t, i) => T(t, x + 60, y + 260 + i * 26, { s: 17, w: '600', c: '#3a210c' }));
  button(x + w / 2 - 130, y + h - 90, 260, 56, 'LANJUT', () => { ui.modal = null; kota().tab = r.win ? 'politik' : 'politik'; save(); }, { col: 'green', s: 20 });
}

/** Penutup masa jabatan 30 hari. */
export function kotaAkhirModal() {
  const e = endingInfo(), c = city(); if (!e || !c) { ui.modal = null; return; }
  const x = 240, y = 60, w = 800, h = 600; panel(x, y, w, h);
  T('AKHIR MASA JABATAN', x + w / 2, y + 50, { s: 16, a: 'center', c: '#7a5a3a', w: '700' });
  T(e.title, x + w / 2, y + 104, { s: 42, a: 'center', c: '#b87a14', stroke: '#fff3c8', sw: 3 });
  wrapText(e.text, w - 100, 18, '600').forEach((t, i) => T(t, x + 50, y + 160 + i * 28, { s: 18, w: '600', c: '#3a210c' }));
  T(`Kesejahteraan ${Math.round(c.ind.sej)} · Kebersihan ${Math.round(c.ind.bers)} · Kerja ${Math.round(c.ind.kerja)} · Kepuasan ${Math.round(c.ind.puas)} · Integritas ${Math.round(kota().integ)}`, x + w / 2, y + h - 120, { s: 14, a: 'center', c: '#7a5a3a', w: '700' });
  button(x + w / 2 - 170, y + h - 84, 340, 56, 'LANJUT MAIN (MODE BEBAS)', () => { ui.modal = null; save(); }, { col: 'green', s: 18 });
}
