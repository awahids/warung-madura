import { ctx } from '../gfx.js';
import { BIZ, BIZ_MAX, CAMP_ACTS, CAMP_DAYS, CITY_DAYS, IND, MAX_PROJ, PROJECTS, RIVAL, WIN_WEALTH } from '../story/kota.js';
import { assetValue, awardTender, bizIncAt, bizLevel, bizNextCost, buyBiz, campUses, campaign, cancelTender, canBuild, canRun, city, cityAvg, dn, dprdBlock, endingInfo, incomeNominal, incomePerDay, isMiliarder, kota, netWorth, projectEffect, reportAssets, rivalPower, runForOffice, rushCost, setEproc, usahaOpen, canReelect, runSecondTerm, retire, warisanLines, victimOf, riskNow, bantuWarga, canBantu, BANTU_COST, wargaList, hajiOf, epilogPeople, startTender, support, taxPerDay } from '../logic/kota.js';
import { AUDIT_DAYS, DPRD_MIN, EPROC_COST, RUSH_PCT } from '../story/dunia.js';
import { story } from '../logic/story.js';
import { G, ui } from '../state.js';
import { T, clamp, rpk, rr, wrapText } from '../util.js';
import { button, panel } from '../widgets.js';
import { save } from '../persist.js';
import { skipDay } from '../logic/day.js';
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
  if (usahaOpen()) button(x + w - 270, y + 22, 200, 40, `LEWATI HARI ▶`, () => { ui.modal = null; if (skipDay() === 'skipped' && !ui.modal) ui.modal = 'kota'; }, { col: 'blue', s: 15, tip: `Hari ${G.day} selesai lebih cepat: warung tutup (tanpa pendapatan warung). Pendapatan usaha, pajak, proyek, dan cerita tetap berjalan; cerita hari ini dibuka dulu bila ada.` });
  T(`Kekayaan bersih ${rpk(netWorth())}  ·  Kas ${rpk(G.money)}  ·  Aset ${rpk(assetValue())}  ·  Pendapatan usaha ${rpk(incomePerDay())}/hari`, x + 36, y + 82, { s: 14, w: '700', c: '#5a3a1a' });
  [['usaha', 'USAHA'], ['politik', wali ? 'KOTA' : 'POLITIK'], ['warga', 'WARGA'], ['awasi', 'AWASI']].forEach(([id, label], i) => {
    button(x + 36 + i * 170, y + 96, 160, 40, label, () => { k.tab = id; }, { col: k.tab === id ? 'yellow' : 'wood', tc: k.tab === id ? '#4a2a00' : '#fff', s: 16 });
  });
  if (k.tab === 'politik') (wali ? kotaTab : politikTab)(k, x, y + 150, w); else if (k.tab === 'awasi') awasiTab(k, x, y + 150, w); else if (k.tab === 'warga') wargaTab(k, x, y + 150, w); else usahaTab(k, x, y + 150, w);
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
    const wait = lv && (k.ready[b.id] || 0) > G.day ? k.ready[b.id] - G.day : 0;
    T(lv ? (wait ? `Lv ${lv} · izin diproses ${wait} hari` : `Lv ${lv} · ${rpk(inc)}/hari`) : 'Belum dibuka', x + 440, ry + 32, { s: 17, w: '800', c: lv ? '#2a5a1a' : '#7a6a5a' });
    if (nx !== null) T(`${lv ? 'Naik' : 'Buka'}: +${rpk(gain)}/hari  ·  balik modal ~${Math.ceil(nx / gain)} hari`, x + 440, ry + 56, { s: 13, w: '700', c: '#5a3a1a' });
    else T('Level maksimum', x + 440, ry + 56, { s: 13, w: '700', c: '#5a3a1a' });
    button(x + w - 250, ry + 20, 190, 52, nx === null ? 'MAKS' : `${lv ? 'NAIK' : 'BUKA'} ${rpk(nx)}`, () => buyBiz(b.id), { col: 'green', s: 17, disabled: nx === null || G.money < nx, tip: nx !== null && G.money < nx ? 'Kas belum cukup' : 'Pendapatan masuk tiap pagi' });
  });
  T(`Nominal ${rpk(incomeNominal())}/hari, nyata hari ini ${rpk(incomePerDay())} (dipengaruhi pelanggan, saingan, inflasi, dan izin). Aset dihitung 70% untuk kekayaan bersih.`, x + 36, y + 52 + BIZ.length * 98 + 12, { s: 13, w: '600', c: '#7a5a3a' });
}

function politikTab(k, x, y, w) {
  const s = story(), sup = support(), kamp = k.phase === 'kampanye';
  if (k.final) { T('Masa jabatanmu sudah selesai.', x + 40, y + 50, { s: 20, w: '800', c: '#6b3a14' }); button(x + 40, y + 80, 300, 50, 'LIHAT WARISAN', () => { ui.modal = 'warisan'; }, { col: 'green', s: 18 }); return; }
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
  T(`Periode ${k.term || 1} · rata-rata ${cityAvg()} · proyek berjalan ${c.proj.length}/${MAX_PROJ}${c.talangan ? ` · talangan ${rpk(c.talangan)}` : ''}`, x + 36, y + 90, { s: 13, w: '700', c: '#7a5a3a' });
  PROJECTS.forEach((p, i) => {
    const col = i % 3, row = Math.floor(i / 3), cw = (w - 56 - 24) / 3, cx = x + 28 + col * (cw + 12), cy = y + 100 + row * 103;
    const broken = c.broken && c.broken[p.id], done = c.done[p.id] && !broken, run = c.proj.find(q => q.id === p.id), can = canBuild(p.id), blocked = dprdBlock(p.id), locked = (p.term || 1) > (k.term || 1);
    card(cx, cy, cw, 96, locked ? 'rgba(200,200,200,.35)' : broken ? 'rgba(230,150,130,.4)' : done ? 'rgba(120,200,110,.3)' : run ? 'rgba(255,225,130,.4)' : 'rgba(255,255,255,.55)', broken ? '#d88a7a' : done ? '#7ac070' : '#d6bf8a');
    T(p.name, cx + 12, cy + 21, { s: 15, c: locked ? '#8a8a8a' : '#3a210c' });
    T(`${rpk(p.cost)} · ${p.days} hari${blocked ? ' · butuh DPRD' : ''}`, cx + 12, cy + 38, { s: 11, w: '700', c: blocked ? '#b3281e' : '#5a3a1a' });
    T(fxText(p.fx), cx + 12, cy + 53, { s: 11, w: '700', c: locked ? '#8a8a8a' : '#2a5a1a' });
    if (locked) T('Terbuka di periode kedua', cx + 12, cy + 80, { s: 13, w: '800', c: '#8a8a8a' });
    else if (done) T(`✔ Selesai · kualitas ${c.qual[p.id] || '—'}${c.fail && c.fail[p.id] ? ' ⚠' : ''}`, cx + 12, cy + 80, { s: 13, w: '800', c: '#2a5a1a' });
    else if (run) T(`${run.who} · mutu ${run.quality} · sisa ${run.left} hari`, cx + 12, cy + 80, { s: 12, w: '800', c: '#a05a1a' });
    else button(cx + 10, cy + 60, cw - 20, 30, broken ? 'RUSAK — TENDER ULANG' : 'TENDER PROYEK', () => startTender(p.id), { col: broken ? 'red' : 'green', s: 13, disabled: !can && !blocked, tip: blocked ? `DPRD menahan proyek besar (dukungan < ${DPRD_MIN}). Lihat tab AWASI.` : !can ? (c.proj.length >= MAX_PROJ ? 'Dinas PU penuh' : 'Kas kota belum cukup') : 'Pilih kontraktor lewat lelang' });
  });
}

/** Tab WARGA: orang-orang dari warung yang kini merasakan keputusanmu, dan Pak Haji. */
function wargaTab(k, x, y, w) {
  if (k.phase !== 'wali' || !k.warga) { T('Warga lama akan datang ke balai kota saat kamu memimpin kota.', x + 40, y + 50, { s: 18, w: '700', c: '#7a6a5a' }); T('Bu Sri, Bang Jaka, Rani, Pak Darto, Bu Wati, dan Pak Haji mengingat semua yang kamu lakukan di warung.', x + 40, y + 80, { s: 15, w: '600', c: '#7a6a5a' }); return; }
  const h = hajiOf(), moodCol = m => m >= 65 ? '#58b948' : m >= 40 ? '#e0b030' : '#d6483a';
  card(x + 28, y, w - 56, 70, 'rgba(255,240,200,.7)', '#d6a84a');
  T('Pak Haji', x + 52, y + 30, { s: 22, c: '#3a210c' });
  T(h >= 65 ? 'Bangga dan selalu mendoakanmu.' : h >= 40 ? 'Diam-diam khawatir. Teleponnya makin jarang.' : 'Kecewa. Ia tidak lagi menanyakan kabarmu.', x + 52, y + 54, { s: 13, w: '600', c: '#5a3a1a' });
  bar(x + 520, y + 26, 380, 16, h / 100, moodCol(h)); T(String(Math.round(h)), x + 910, y + 40, { s: 13, w: '700', c: '#5a3a1a' });
  wargaList().forEach((p, i) => {
    const ry = y + 82 + i * 72;
    card(x + 28, ry, w - 56, 64);
    T(p.name, x + 52, ry + 26, { s: 19, c: '#3a210c' }); T(p.role, x + 52, ry + 48, { s: 12, w: '600', c: '#7a5a3a' });
    T(p.talk ? `"${p.talk}"` : '', x + 230, ry + 26, { s: 14, w: '700', c: '#3a2a1a' });
    T(p.janji ? `Janjimu: ${PROJECTS.find(q => q.id === p.janji.proj).name} sebelum hari ke-${p.janji.due}` : `Butuh: ${p.wants.map(id => PROJECTS.find(q => q.id === id).name).join(', ')}${p.fears ? ` · khawatir: ${p.fears.map(id => PROJECTS.find(q => q.id === id).name).join(', ')}` : ''}`, x + 230, ry + 48, { s: 12, w: '700', c: p.janji ? '#a05a1a' : '#5a5a5a' });
    bar(x + 690, ry + 24, 120, 14, p.mood / 100, moodCol(p.mood)); T(String(Math.round(p.mood)), x + 816, ry + 36, { s: 13, w: '700', c: '#5a3a1a' });
    button(x + 852, ry + 12, 124, 40, 'BANTU', () => bantuWarga(p.id), { col: 'blue', s: 14, disabled: !canBantu(p.id), tip: `${rpk(BANTU_COST)} dari kantongmu, diam-diam. Suasana hati +8 (jeda 3 hari)` });
  });
  T('Mereka juga belanja di warungmu dan membicarakan kota, tanpa tahu kamu sedang mendengarkan.', x + 36, y + 82 + 5 * 72 + 14, { s: 13, w: '600', c: '#7a5a3a' });
}

/** Tab AWASI: jejak korupsi, sorotan, DPRD, harga, program antikorupsi, dan berita. */
function awasiTab(k, x, y, w) {
  const d = dn(), c = city(), wali = k.phase === 'wali';
  const meter = (label, v, col, bx, by, bw, mark, hint) => { T(label, bx, by, { s: 13, w: '800', c: '#a05a1a' }); bar(bx, by + 8, bw, 14, v / 100, col); if (mark !== undefined) { ctx.fillStyle = '#3a210c'; ctx.fillRect(bx + bw * mark / 100 - 1, by + 4, 3, 22); } T(hint || String(Math.round(v)), bx + bw + 8, by + 21, { s: 12, w: '700', c: '#5a3a1a' }); };
  meter('INTEGRITAS', k.integ, k.integ >= 70 ? '#58b948' : k.integ >= 40 ? '#e0b030' : '#d6483a', x + 36, y + 10, 330);
  if (wali) {
    meter('JEJAK KORUPSI (bukti yang bisa ditemukan)', d.jejak, d.jejak < 30 ? '#58b948' : d.jejak < 60 ? '#e0b030' : '#d6483a', x + 36, y + 56, 330);
    meter('SOROTAN MEDIA', d.sorotan, '#5aa6ee', x + 36, y + 102, 330);
    meter('DUKUNGAN DPRD', d.dprd, d.dprd >= DPRD_MIN ? '#58b948' : '#d6483a', x + 36, y + 148, 330, DPRD_MIN, `${Math.round(d.dprd)} (min ${DPRD_MIN} untuk proyek besar)`);
    const next = AUDIT_DAYS.find(a => a >= c.day); T(`Audit BPK berikutnya: hari ke-${next || '—'} masa jabatan · Fee yang pernah diterima: ${rpk(d.fees)}`, x + 36, y + 200, { s: 13, w: '700', c: '#7a3a2a' });
    button(x + 36, y + 216, 330, 42, d.eproc ? 'Lelang terbuka: AKTIF' : `LELANG TERBUKA ${rpk(EPROC_COST)}`, () => setEproc(), { col: d.eproc ? 'grey' : 'green', s: 15, disabled: d.eproc || c.apbd < EPROC_COST, tip: 'E-procurement: tanpa fee & kroni, audit lebih ringan, DPRD agak kecewa' });
    button(x + 36, y + 266, 330, 42, d.lhkpn ? 'LHKPN sudah dilaporkan' : 'LAPOR HARTA (LHKPN)', () => reportAssets(), { col: d.lhkpn ? 'grey' : 'blue', s: 15, disabled: d.lhkpn, tip: 'Integritas +3, sorotan −5' });
  }
  const harga = Math.round((d.harga - 1) * 100); const hx = wali ? x + 36 : x + 36, hy = wali ? y + 326 : y + 56;
  T(`Indeks harga ${harga >= 0 ? '+' : ''}${harga}% · pelanggan ${d.saingan > 0 ? `berkurang karena saingan (${d.saingan} hari)` : 'normal'}`, hx, hy, { s: 13, w: '700', c: '#5a3a1a' });
  T('BERITA TERBARU', x + 400, y + 18, { s: 13, w: '800', c: '#a05a1a' });
  const log = d.log.slice(-11).reverse(), col = { audit: '#b3281e', kpk: '#b3281e', rusak: '#b3281e', proyek: '#7a5a1a', harga: '#a05a1a', usaha: '#2a5a1a' };
  if (!log.length) T('Belum ada berita.', x + 400, y + 48, { s: 14, w: '600', c: '#7a6a5a' });
  log.forEach((n, i) => { const ls = wrapText(`Hari ${n.day}: ${n.text}`, w - 440, 13, '600'); T(ls[0] + (ls.length > 1 ? '…' : ''), x + 400, y + 44 + i * 26, { s: 13, w: '600', c: col[n.kind] || '#3a210c' }); });
}

/** Lelang proyek: pilih kontraktor. Fee/komisi hanya muncul bila tidak ada lelang terbuka. */
export function tenderModal() {
  const c = city(), t = c && c.tender; if (!t) { ui.modal = 'kota'; return; }
  const p = PROJECTS.find(q => q.id === t.id), x = 150, y = 40, w = 980, h = 640; panel(x, y, w, h);
  T(`TENDER: ${p.name.toUpperCase()}`, x + 36, y + 56, { s: 30, c: '#6b3a14' }); closeBtn(x + w - 40, y + 40, cancelTender);
  T(`Pagu ${rpk(p.cost)} · kas kota ${rpk(c.apbd)} · ${p.days} hari · kualitas menentukan besar manfaat proyek`, x + 36, y + 84, { s: 14, w: '700', c: '#5a3a1a' });
  const NOTE = { jujur: 'Harga wajar, kualitas tinggi, jarang molor.', murah: 'Murah tapi kualitas rendah; proyek bisa rusak dan sering molor.', kroni: 'Mahal, tapi menawarkan fee besar ke kantongmu. Bukti jejak.', sendiri: 'Milik usahamu sendiri: konflik kepentingan, tapi ada bagi hasil.' };
  const sit = t.sit || []; sit.forEach((l, i) => T('⚠ ' + l, x + 36, y + 106 + i * 20, { s: 13, w: '800', c: '#a0461a' }));
  const top = y + 104 + sit.length * 20 + (sit.length ? 6 : 0);
  t.bids.forEach((b, i) => {
    const ry = top + i * 92, cant = c.apbd < (b.upfront || b.price) || (t.rush && G.money < rushCost(b)), dirty = b.fee > 0;
    card(x + 28, ry, w - 56, 86, dirty ? 'rgba(230,150,130,.28)' : 'rgba(255,255,255,.55)', dirty ? '#d88a7a' : '#d6bf8a');
    T(b.name, x + 50, ry + 30, { s: 20, c: '#3a210c' });
    const vic = victimOf(b, p); T(vic || NOTE[b.key], x + 50, ry + 52, { s: 13, w: vic ? '700' : '600', c: vic ? '#9a3a2a' : '#5a3a1a' });
    T(`Harga ${rpk(b.price)} (${Math.round(b.price / p.cost * 100)}%) · mutu ~${b.quality} (manfaat ${Math.round(projectEffect(b.quality) * 100)}%) · andal ${Math.round(b.rel * 100)}% · ${Math.max(1, p.days + (b.rel < .6 ? 1 : 0) + (b.dd || 0) - (t.rush ? 2 : 0))} hari${b.upfront ? ` · bayar dulu ${rpk(b.upfront)}` : ''}`, x + 50, ry + 74, { s: 13, w: '700', c: '#2a4a6a' });
    if (dirty) T(`Fee untukmu ${rpk(t.share ? Math.round(b.fee / 2) : b.fee)}`, x + w - 290, ry + 24, { s: 14, a: 'right', w: '800', c: '#b3281e' });
    button(x + w - 270, ry + 22, 210, 50, 'PILIH', () => awardTender(i), { col: dirty ? 'red' : 'green', s: 18, disabled: cant, tip: cant ? 'Kas kota / uang pribadi tidak cukup' : '' });
  });
  const by = top + t.bids.length * 92 + 6;
  button(x + 28, by, 460, 44, `${t.rush ? '☑' : '☐'} Uang pelicin percepat izin (−2 hari, ${Math.round(RUSH_PCT * 100)}% harga dari kantongmu)`, () => { t.rush = !t.rush; }, { col: t.rush ? 'red' : 'wood', s: 14, tip: 'Praktik nyata: izin cepat dengan "uang administrasi". Jejak +3, integritas −4' });
  if (t.bids.some(b => b.fee > 0)) button(x + 500, by, 452, 44, `${t.share ? '☑' : '☐'} Bagi separuh fee ke DPRD (dewan +12)`, () => { t.share = !t.share; }, { col: t.share ? 'red' : 'wood', s: 14, tip: 'Fee untukmu separuh, tapi DPRD mendukung proyek besar. Jejak +2' });
  T(`Risiko ketahuan saat ini: ${riskNow().toUpperCase()}${dn().feesEver ? '' : ' · belum ada yang curiga'}`, x + 36, by + 66, { s: 14, w: '800', c: riskNow() === 'rendah' ? '#2a6a2a' : riskNow() === 'sedang' ? '#a06a1a' : '#b3281e' });
  T('Penawar yang menawarkan fee bukan kebetulan: itu cara kerja suap & kickback. Jejaknya bisa ditemukan audit dan pelapor.', x + 36, y + h - 24, { s: 12, w: '600', c: '#7a5a3a' });
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
  button(x + w / 2 - 130, y + h - 90, 260, 56, 'LANJUT', () => { ui.modal = kota().final ? 'warisan' : null; kota().tab = 'politik'; save(); }, { col: 'green', s: 20 });
}

/** Penutup masa jabatan 30 hari. */
export function kotaAkhirModal() {
  const e = endingInfo(), c = city(); if (!e || !c) { ui.modal = null; return; }
  const x = 240, y = 60, w = 800, h = 600; panel(x, y, w, h);
  T('AKHIR MASA JABATAN', x + w / 2, y + 50, { s: 16, a: 'center', c: '#7a5a3a', w: '700' });
  T(e.title, x + w / 2, y + 104, { s: 42, a: 'center', c: '#b87a14', stroke: '#fff3c8', sw: 3 });
  const tl = wrapText(e.text, w - 100, 17, '600'); tl.forEach((t, i) => T(t, x + 50, y + 150 + i * 25, { s: 17, w: '600', c: '#3a210c' }));
  let py = y + 150 + tl.length * 25 + 12; for (const l of epilogPeople()) for (const t of wrapText('• ' + l, w - 100, 15, '600')) { if (py > y + h - 140) break; T(t, x + 50, py, { s: 15, w: '600', c: '#5a3a1a' }); py += 22; }
  T(`Kesejahteraan ${Math.round(c.ind.sej)} · Kebersihan ${Math.round(c.ind.bers)} · Kerja ${Math.round(c.ind.kerja)} · Kepuasan ${Math.round(c.ind.puas)} · Integritas ${Math.round(kota().integ)}`, x + w / 2, y + h - 120, { s: 14, a: 'center', c: '#7a5a3a', w: '700' });
  if (canReelect()) {
    button(x + 40, y + h - 84, 350, 56, 'MAJU PERIODE KEDUA', () => { runSecondTerm(); save(); }, { col: 'green', s: 18, tip: 'Kampanye 7 hari. Warga menilai hasil kerjamu, suasana hati warga lama, dan restu Pak Haji.' });
    button(x + w - 390, y + h - 84, 350, 56, 'CUKUP SATU PERIODE', () => { retire(); save(); }, { col: 'wood', s: 18 });
  } else if (kota().final) button(x + w / 2 - 170, y + h - 84, 340, 56, 'LIHAT WARISAN', () => { ui.modal = 'warisan'; save(); }, { col: 'green', s: 18 });
  else button(x + w / 2 - 170, y + h - 84, 340, 56, 'LANJUT MAIN (MODE BEBAS)', () => { ui.modal = null; save(); }, { col: 'green', s: 18 });
}

/** Penutup akhir: warisan dua periode, penerus, warung lama, Pak Haji, warga. */
export function warisanModal() {
  const W0 = warisanLines(), x = 200, y = 40, w = 880, h = 640; panel(x, y, w, h);
  T('PENUTUP', x + w / 2, y + 46, { s: 16, a: 'center', c: '#7a5a3a', w: '700' });
  T(W0.title, x + w / 2, y + 100, { s: 44, a: 'center', c: '#b87a14', stroke: '#fff3c8', sw: 3 });
  let py = y + 150;
  W0.lines.forEach((l, i) => { for (const t of wrapText((i ? '• ' : '') + l, w - 100, i ? 15 : 17, '600')) { if (py > y + h - 110) return; T(t, x + 50, py, { s: i ? 15 : 17, w: i ? '600' : '700', c: i ? '#4a3a1a' : '#3a210c' }); py += i ? 23 : 26; } py += 4; });
  T('Terima kasih sudah bermain Juragan Warung.', x + w / 2, y + h - 96, { s: 14, a: 'center', c: '#7a5a3a', w: '700' });
  button(x + w / 2 - 170, y + h - 80, 340, 56, 'LANJUT MAIN (MODE BEBAS)', () => { ui.modal = null; save(); }, { col: 'green', s: 18 });
}
