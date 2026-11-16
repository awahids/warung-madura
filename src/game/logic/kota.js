import { SFX } from '../audio.js';
import { BIZ, BIZ_COST_MUL, BIZ_INC_MUL, BIZ_MAX, BIZ_RESALE, CAMP_ACTS, CAMP_DAYS, CITY_DAYS, ENDINGS, IND, MARKUP, MARKUP_CAUGHT, MARKUP_INTEG, MAX_PROJ, PROJECTS, RIVAL, WIN_WEALTH } from '../story/kota.js';
import { G, ui } from '../state.js';
import { clamp, ri, rpk } from '../util.js';
import { toast } from '../widgets.js';

/* ============================================================
   BABAK LANJUTAN: usaha → miliarder → kampanye → wali kota.
   Semua uang pribadi memakai G.money; kas kota (APBD) terpisah di kota().city.apbd.
   Catatan: modul ini tidak mengimpor story.js (menghindari impor melingkar) — flag & kepercayaan diakses lewat G.story.
   ============================================================ */
export function initKota() {
  return { ch: 0, phase: 'none', biz: {}, duk: 0, integ: 80, rivalBonus: ri(-4, 6), camp: { day: 0, pts: 0, uses: {} }, sympathy: 0, lost: 0, lostDay: -99, lastDay: 0, city: null, ending: null, tab: 'usaha' };
}
export const kota = () => G.kota || (G.kota = initKota());
const st = () => G.story || (G.story = { trust: 50, flags: {}, kabar: [] });
const flag = f => !!st().flags[f];
const setFlag = f => { st().flags[f] = true; };
const addTrust = n => { const s = st(); s.trust = clamp(Math.round((s.trust + n) * 10) / 10, 0, 100); };
const note = t => { (G.morning || (G.morning = [])).push(t); st().kabar && st().kabar.push(t); };

/* ---------- usaha ---------- */
export const bizLevel = id => kota().biz[id] || 0;
export const bizCostAt = (b, lvl) => Math.round(b.cost * BIZ_COST_MUL ** (lvl - 1));
export const bizIncAt = (b, lvl) => lvl <= 0 ? 0 : Math.round(b.inc * BIZ_INC_MUL ** (lvl - 1));
export const bizNextCost = id => { const b = BIZ.find(x => x.id === id), l = bizLevel(id); return l >= BIZ_MAX ? null : bizCostAt(b, l + 1); };
export const incomePerDay = () => BIZ.reduce((s, b) => s + bizIncAt(b, bizLevel(b.id)), 0);
export const assetValue = () => Math.round(BIZ.reduce((s, b) => { let c = 0; for (let l = 1; l <= bizLevel(b.id); l++) c += bizCostAt(b, l); return s + c; }, 0) * BIZ_RESALE);
export const netWorth = () => Math.round((G.money || 0) + assetValue());
export const isMiliarder = () => netWorth() >= WIN_WEALTH;
export const usahaOpen = () => kota().ch >= 6;
export function buyBiz(id) {
  const k = kota(), c = bizNextCost(id), b = BIZ.find(x => x.id === id);
  if (!k.ch || c === null || G.money < c) { SFX.err(); return false; }
  G.money -= c; k.biz[id] = bizLevel(id) + 1; SFX.good();
  toast(`${b.name} ${k.biz[id] === 1 ? 'dibuka' : 'naik ke Lv ' + k.biz[id]}! +${rpk(bizIncAt(b, k.biz[id]) - bizIncAt(b, k.biz[id] - 1))}/hari`, '#cfe8ff');
  return true;
}

/* ---------- dukungan politik & kampanye ---------- */
export const flagBonus = () => (flag('banjir_bantu') ? 4 : 0) + (flag('beasiswa') ? 3 : 0) + (flag('buka_kerja') ? 3 : 0);
export function support() {
  const k = kota(), s = st(), r = G.rep || 50;
  const integPen = k.integ < 50 ? (50 - k.integ) * .3 : 0;
  return clamp(Math.round(12 + s.trust * .3 + r * .12 + k.duk + flagBonus() + k.sympathy + k.camp.pts - integPen), 0, 100);
}
export const rivalPower = () => 52 + kota().rivalBonus;
export const canRun = () => { const k = kota(); return k.ch >= 7 && k.phase === 'usaha' && flag('diminta_calon') && st().trust >= 55 && G.day - k.lostDay >= 5; };
export function runForOffice() {
  const k = kota(); if (!canRun()) { SFX.err(); return false; }
  k.phase = 'kampanye'; k.ch = 8; k.camp = { day: 0, pts: 0, uses: {} }; k.tab = 'politik'; SFX.chapter();
  toast(`Kamu resmi mencalonkan diri! Lawan: ${RIVAL}.`, '#ffe45c'); return true;
}
export const campUses = id => kota().camp.uses[id] || 0;
export function campaign(id) {
  const k = kota(), a = CAMP_ACTS.find(x => x.id === id);
  if (!a || k.phase !== 'kampanye' || campUses(id) >= a.max || G.money < a.cost) { SFX.err(); return false; }
  G.money -= a.cost; k.camp.uses[id] = campUses(id) + 1; k.camp.pts += a.pts; SFX.coin();
  if (a.dirty) {
    k.integ = clamp(k.integ - 25, 0, 100);
    if (Math.random() < .4) { k.camp.pts -= a.pts + 20; addTrust(-10); setFlag('skandal'); toast('Serangan fajar KETAHUAN! Dukungan anjlok.', '#ff9a8a'); return true; }
  }
  toast(`${a.name}: dukungan +${a.pts}`, '#cfe8ff'); return true;
}
/** Hasil pemilihan: skor dukungan (± acak kecil) melawan kekuatan lawan. */
export function runElection() {
  const k = kota(), sc = support() + ri(-4, 4), rv = rivalPower(), win = sc > rv;
  const share = clamp(Math.round(50 + (sc - rv) * .9), 25, 78);
  k.result = { win, share, score: sc, rival: rv };
  if (win) {
    k.phase = 'wali'; k.ch = 9; setFlag('wali'); k.city = initCity(); k.tab = 'kota';
    G.morning && G.morning.push(`Kamu terpilih jadi wali kota dengan ${share}% suara!`);
  } else {
    k.phase = 'usaha'; k.ch = 7; k.lost++; k.lostDay = G.day; k.sympathy += 5; k.camp = { day: 0, pts: 0, uses: {} };
    G.morning && G.morning.push(`Kalah tipis: ${share}% suara. Warga simpati, kamu bisa mencalonkan lagi 5 hari lagi.`);
  }
  ui.modal = 'pilkada'; (win ? SFX.ending : SFX.down)();
  return k.result;
}

/* ---------- kota ---------- */
export function initCity() {
  return { day: 1, apbd: 250e6, ind: { sej: 42, bers: 40, kerja: 40, puas: 55 }, proj: [], done: {}, mark: 0, caught: 0, taxToday: 0 };
}
export const city = () => kota().city;
export const cityAvg = () => { const c = city(); return c ? Math.round((c.ind.sej + c.ind.bers + c.ind.kerja + c.ind.puas) / 4) : 0; };
export const taxPerDay = () => { const c = city(); return c ? Math.round(15e6 + (c.ind.sej + c.ind.kerja) * .45e6) : 0; };
export const projectBusy = id => !!city() && city().proj.some(p => p.id === id);
export const canBuild = id => {
  const c = city(), p = PROJECTS.find(x => x.id === id);
  return !!c && !!p && !c.done[id] && !projectBusy(id) && c.proj.length < MAX_PROJ && c.apbd >= p.cost;
};
function addInd(fx) { const c = city(); if (!c || !fx) return; for (const key in fx) c.ind[key] = clamp(c.ind[key] + fx[key], 0, 100); }
export function build(id, markup = false) {
  const c = city(), p = PROJECTS.find(x => x.id === id), k = kota(); if (!canBuild(id)) { SFX.err(); return false; }
  c.apbd -= p.cost; c.proj.push({ id, left: p.days }); SFX.click();
  if (markup) {
    const skim = Math.round(p.cost * MARKUP); G.money += skim; k.integ = clamp(k.integ - MARKUP_INTEG, 0, 100); c.mark++; setFlag('korup_awal');
    if (Math.random() < MARKUP_CAUGHT) { c.caught++; addInd({ puas: -15 }); const fine = skim * 2; G.money = Math.max(0, G.money - fine); toast(`Mark-up ketahuan! Denda ${rpk(fine)}, kepuasan warga anjlok.`, '#ff9a8a'); }
    else toast(`Mark-up diam-diam: +${rpk(skim)}`, '#ffd0a0');
  } else toast(`${p.name} mulai dibangun (${p.days} hari).`, '#cfe8ff');
  return true;
}
export function applyKotaFx(fx = {}) {
  const k = kota(), lines = [];
  if (fx.integ) { k.integ = clamp(k.integ + fx.integ, 0, 100); lines.push(`Integritas ${fx.integ > 0 ? '+' : '−'}${Math.abs(fx.integ)}`); }
  if (fx.duk) { k.duk += fx.duk; lines.push(`Dukungan ${fx.duk > 0 ? '+' : '−'}${Math.abs(fx.duk)}`); }
  if (fx.apbd && city()) { city().apbd = Math.max(0, city().apbd + fx.apbd); lines.push(`Kas kota ${fx.apbd > 0 ? '+' : '−'}${rpk(Math.abs(fx.apbd))}`); }
  if (fx.kota) { addInd(fx.kota); for (const key in fx.kota) lines.push(`${IND[key]} ${fx.kota[key] > 0 ? '+' : '−'}${Math.abs(fx.kota[key])}`); }
  return lines;
}
export function endingOf() {
  const k = kota(), avg = cityAvg(), c = city();
  if (k.integ < 40) return 'korup';
  if (avg >= 58 && k.integ >= 70 && c.ind.puas >= 60) return 'bapak';
  return 'biasa';
}

/* ---------- awal hari ---------- */
/** Dipanggil saat hari baru dimulai (sebelum cerita dijadwalkan): buka babak, pendapatan usaha, kampanye, kota. */
export function dawnKota() {
  const k = kota(), s = st();
  if (!k.ch && s.ending) { k.ch = 6; k.phase = 'usaha'; setFlag('babak_usaha'); }
  if (!k.ch || k.lastDay === G.day) return;
  k.lastDay = G.day;
  const inc = incomePerDay();
  if (inc > 0 && G.day > 1) { G.money += inc; note(`Pendapatan usaha ${rpk(inc)}.`); }
  if (k.ch === 6 && isMiliarder()) { k.ch = 7; setFlag('miliarder'); note('Kekayaan bersihmu menembus Rp 1 miliar!'); }
  if (k.phase === 'kampanye') { k.camp.day++; if (k.camp.day >= CAMP_DAYS) runElection(); }
  else if (k.phase === 'wali' && k.city) cityDawn();
}
function cityDawn() {
  const c = city(), k = kota();
  const tax = taxPerDay(); c.apbd += tax; c.taxToday = tax;
  for (const key in c.ind) c.ind[key] = clamp(c.ind[key] - (key === 'bers' ? .25 : .15), 0, 100);
  c.ind.puas = clamp(c.ind.puas + ((c.ind.sej + c.ind.bers + c.ind.kerja) / 3 - 50) * .06, 0, 100);
  const rest = [];
  for (const p of c.proj) {
    p.left--; if (p.left > 0) { rest.push(p); continue; }
    const def = PROJECTS.find(x => x.id === p.id); c.done[p.id] = true; addInd(def.fx); SFX.good();
    note(`${def.name} selesai!`); toast(`${def.name} selesai!`, '#ffe45c');
  }
  c.proj = rest; c.day++;
  note(`Kas kota +${rpk(tax)}.`);
  if (c.day > CITY_DAYS && !k.ending) { k.ending = endingOf(); ui.modal = 'kota_akhir'; SFX.ending(); }
}
export const endingInfo = () => ENDINGS[kota().ending] || null;
