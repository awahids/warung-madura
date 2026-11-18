import { SFX } from '../audio.js';
import { BEASISWA, CITY_TALK, EPI, HAJI_DAYS, JALAN_M, TALK, WARGA, WARGA_POOL } from '../story/warga.js';
import { AUDIT_DAYS, DPRD_MIN, DPRD_MIN_COST, ENDING_ARREST, EPROC_COST, NAMES, PERMIT_DAYS, RUSH_DAYS, RUSH_PCT } from '../story/dunia.js';
import { BIZ, BIZ_COST_MUL, BIZ_INC_MUL, BIZ_MAX, BIZ_RESALE, CAMP_ACTS, CAMP_DAYS, CITY_DAYS, ENDINGS, IND, MAX_PROJ, PROJECTS, RIVAL, WIN_WEALTH } from '../story/kota.js';
import { G, ui } from '../state.js';
import { clamp, pick, ri, rpk } from '../util.js';
import { toast } from '../widgets.js';

/* ============================================================
   BABAK LANJUTAN: usaha → miliarder → kampanye → wali kota.
   Semua uang pribadi memakai G.money; kas kota (APBD) terpisah di kota().city.apbd.
   Catatan: modul ini tidak mengimpor story.js (menghindari impor melingkar) — flag & kepercayaan diakses lewat G.story.
   ============================================================ */
export function initKota() {
  return { ch: 0, phase: 'none', biz: {}, duk: 0, integ: 80, rivalBonus: ri(-4, 6), camp: { day: 0, pts: 0, uses: {} }, sympathy: 0, lost: 0, lostDay: -99, lastDay: 0, city: null, ending: null, dunia: initDunia(), ready: {}, tab: 'usaha' };
}
export function initDunia() { return { jejak: 0, sorotan: 0, dprd: 55, harga: 1, fees: 0, force: null, queue: [], feesEver: 0, saingan: 0, eproc: false, lhkpn: false, arrest: false, log: [], auditN: 0, kpkDay: 0 }; }
export const kota = () => { const k = G.kota || (G.kota = initKota()); if (!k.dunia) k.dunia = initDunia(); if (!k.dunia.queue) k.dunia.queue = []; if (!k.ready) k.ready = {}; return k; };
export const dn = () => kota().dunia;
const st = () => G.story || (G.story = { trust: 50, flags: {}, kabar: [] });
const flag = f => !!st().flags[f];
const setFlag = f => { st().flags[f] = true; };
const addTrust = n => { const s = st(); s.trust = clamp(Math.round((s.trust + n) * 10) / 10, 0, 100); };
const note = (t, kind = '') => { (G.morning || (G.morning = [])).push(t); st().kabar && st().kabar.push(t); const l = kota().dunia.log; l.push({ day: G.day, text: t, kind }); if (l.length > 24) l.shift(); };

/* ---------- usaha ---------- */
export const bizLevel = id => kota().biz[id] || 0;
export const bizCostAt = (b, lvl) => Math.round(b.cost * BIZ_COST_MUL ** (lvl - 1));
export const bizIncAt = (b, lvl) => lvl <= 0 ? 0 : Math.round(b.inc * BIZ_INC_MUL ** (lvl - 1));
export const bizNextCost = id => { const b = BIZ.find(x => x.id === id), l = bizLevel(id); return l >= BIZ_MAX ? null : bizCostAt(b, l + 1); };
export const incomeNominal = () => BIZ.reduce((s, b) => s + bizIncAt(b, bizLevel(b.id)), 0);
const permitOk = id => G.day >= (kota().ready[id] || 0);
/** Pendapatan nyata hari ini: usaha yang izinnya sudah keluar × lalu lintas pelanggan ÷ inflasi. */
export const incomeGross = () => Math.round(BIZ.reduce((s, b) => s + (permitOk(b.id) ? bizIncAt(b, bizLevel(b.id)) : 0), 0) * bizMul());
/** Pendapatan yang benar-benar masuk kantong: ditahan pengelola independen selama menjabat (kecuali kamu tetap mengelola diam-diam). */
export const incomePerDay = () => (G.kota && G.kota.blind && G.kota.phase === 'wali' ? 0 : incomeGross());
export const hargaMul = () => (G.kota && G.kota.dunia ? G.kota.dunia.harga : 1);
/** Pengali jumlah pembeli warung & usaha: ekonomi kota, saingan baru, inflasi. */
export function trafficMul() {
  const k = G.kota; if (!k || !k.ch) return 1; const d = k.dunia || {}; let m = 1;
  if (k.city) m *= .9 + (k.city.ind.sej + k.city.ind.kerja) / 200 * .4;
  if (d.saingan > 0) m *= .85;
  if (d.harga > 1.1) m *= .97;
  return m;
}
export const bizMul = () => trafficMul() / Math.pow(hargaMul(), .6);
export const assetValue = () => Math.round(BIZ.reduce((s, b) => { let c = 0; for (let l = 1; l <= bizLevel(b.id); l++) c += bizCostAt(b, l); return s + c; }, 0) * BIZ_RESALE);
export const netWorth = () => Math.round((G.money || 0) + assetValue());
export const isMiliarder = () => netWorth() >= WIN_WEALTH;
export const usahaOpen = () => kota().ch >= 6;
export function buyBiz(id) {
  const k = kota(), c = bizNextCost(id), b = BIZ.find(x => x.id === id);
  if (!k.ch || c === null || G.money < c) { SFX.err(); return false; }
  const isNew = !bizLevel(id); G.money -= c; k.biz[id] = bizLevel(id) + 1; SFX.good();
  if (isNew) { k.ready[id] = G.day + PERMIT_DAYS; setForce('d_izin'); toast(`Izin ${b.name} diproses ${PERMIT_DAYS} hari.`, '#ffe0a0'); }
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
    k.phase = 'wali'; k.ch = 9; setFlag('wali'); k.city = initCity(); k.tab = 'politik'; dn().dprd = clamp(Math.round(40 + (share - 50) * 1.2), 20, 80); initWarga();
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
export const needsDprd = id => (PROJECTS.find(x => x.id === id) || {}).cost >= DPRD_MIN_COST;
export const dprdBlock = id => needsDprd(id) && dn().dprd < DPRD_MIN;
export const canBuild = id => {
  const c = city(), p = PROJECTS.find(x => x.id === id);
  return !!c && !!p && (!c.done[id] || !!(c.broken && c.broken[id])) && !projectBusy(id) && c.proj.length < MAX_PROJ && c.apbd >= p.cost * .5 && !dprdBlock(id);
};
function addInd(fx, mul = 1) { const c = city(); if (!c || !fx) return; for (const key in fx) c.ind[key] = clamp(c.ind[key] + Math.round(fx[key] * mul * 10) / 10, 0, 100); }

/** Tiga–empat penawar tender: jujur (mahal tapi bagus), murah (kualitas rendah), kroni & milik sendiri (menawarkan fee) bila tidak ada lelang terbuka. */
export function makeBids(id) {
  const p = PROJECTS.find(x => x.id === id), d = dn(), k = kota(), c = city(), bids = [], sit = [];
  const honest = { key: 'jujur', name: pick(NAMES.jujur), price: p.cost, quality: ri(85, 95), rel: .9, fee: 0, dd: 0 };
  bids.push(honest);
  const cheap = Math.round(p.cost * (.75 + Math.random() * .1)); bids.push({ key: 'murah', name: pick(NAMES.murah), price: cheap, quality: ri(40, 55), rel: .5, fee: d.eproc ? 0 : Math.round(cheap * .08), dd: 0 });
  if (!d.eproc) {
    const dear = Math.round(p.cost * (1.25 + Math.random() * .15)), kr = { key: 'kroni', name: pick(NAMES.kroni), price: dear, quality: ri(60, 75), rel: .7, fee: Math.round(dear * .15), dd: 0 };
    bids.push(kr);
    if (Object.values(k.biz).some(v => v > 0)) { const own = Math.round(p.cost * 1.1); bids.push({ key: 'sendiri', name: 'Usaha milikmu', price: own, quality: ri(70, 82), rel: .85, fee: Math.round(own * .12), conflict: true, dd: 0 }); }
    // situasi nyata yang membuat fee menggoda
    const jw = k.janji && Object.entries(k.janji).find(([, v]) => v.proj === id);
    if (jw && c) { honest.dd = 3; kr.dd = -1; kr.rel = .95; const w = WARGA.find(x => x.id === jw[0]); sit.push(`Janjimu ke ${w.name} jatuh tempo hari ke-${jw[1].due}. ${honest.name} sedang antre proyek lain (+3 hari); ${kr.name} menjamin selesai lebih cepat.`); }
    if (c && c.apbd < p.cost) { kr.upfront = Math.round(dear * .5); sit.push(`Kas kota kurang untuk ${honest.name}. ${kr.name} bersedia menalangi: bayar separuh sekarang, sisanya dicicil dari pajak.`); }
    if (Math.random() < .15) { bids.splice(bids.indexOf(honest), 1); sit.push(`${honest.name} mundur: harga material naik. Tidak ada penawar bersih yang tersisa.`); }
  }
  bids.sit = sit;
  return bids;
}
/** Seberapa besar peluang ketahuan saat ini (dirasakan pemain sebelum menerima fee). */
export const riskNow = () => { const d = dn(), r = d.jejak + d.sorotan * .4; return r < 20 ? 'rendah' : r < 45 ? 'sedang' : 'tinggi'; };
export function startTender(id) {
  const c = city(); if (!c) return false;
  if (dprdBlock(id)) { SFX.err(); toast('DPRD menahan anggaran proyek besar. Dekati dewan dulu.', '#ffd0d0'); return false; }
  if (!canBuild(id)) { SFX.err(); return false; }
  const bids = makeBids(id); c.tender = { id, bids, sit: bids.sit, rush: false, share: false }; ui.modal = 'tender'; return true;
}
export const cancelTender = () => { const c = city(); if (c) c.tender = null; ui.modal = 'kota'; };
export const rushCost = bid => Math.round(bid.price * RUSH_PCT);
export function awardTender(i) {
  const c = city(), t = c && c.tender; if (!t) return false;
  const bid = t.bids[i]; if (!bid || c.apbd < (bid.upfront || bid.price) || (t.rush && G.money < rushCost(bid))) { SFX.err(); return false; }
  const ok = award(t.id, bid, t.rush, t.share); c.tender = null; ui.modal = 'kota'; return ok;
}
function award(id, bid, rush, share = false) {
  const c = city(), p = PROJECTS.find(x => x.id === id), k = kota(), d = dn();
  if (bid.upfront) { c.apbd -= bid.upfront; c.talangan = (c.talangan || 0) + bid.price - bid.upfront; } else c.apbd -= bid.price; if (c.broken && c.broken[id]) { c.broken[id] = false; c.done[id] = false; }
  const days = Math.max(1, p.days + (bid.rel < .6 ? 1 : 0) + (bid.dd || 0) - (rush ? RUSH_DAYS : 0));
  c.proj.push({ id, left: days, days, price: bid.price, quality: bid.quality, rel: bid.rel, who: bid.name, key: bid.key, fee: bid.fee });
  SFX.click();
  if (bid.fee > 0) {   // fee/komisi masuk kantong pribadi: itulah korupsi
    const mine = share ? Math.round(bid.fee / 2) : bid.fee;
    if (share) { d.dprd = clamp(d.dprd + 12, 0, 100); d.jejak = clamp(d.jejak + 2, 0, 100); note(`Separuh fee dibagi ke kawan-kawan dewan. DPRD makin mendukung.`, 'fee'); }
    G.money += mine; d.fees += mine; c.mark++; setFlag('korup_awal');
    d.jejak = clamp(d.jejak + (bid.key === 'kroni' ? 7 : bid.key === 'sendiri' ? 8 : 4), 0, 100); d.sorotan = clamp(d.sorotan + 2, 0, 100); k.integ = clamp(k.integ - (bid.key === 'kroni' ? 8 : bid.key === 'sendiri' ? 6 : 5), 0, 100);
    const first = !d.feesEver; d.feesEver += mine;
    moodAll(-4); mood('rani', -12);
    const waiting = WARGA.find(w => w.wants.some(x => !(city().done[x])) && w.id !== 'rani');
    note(`Fee ${rpk(mine)} dari ${bid.name} masuk rekeningmu.${waiting ? ` Di kampung, ${waiting.name} masih menunggu.` : ''} Rani mulai menelusuri kontraknya.`, 'fee');
    if (first) forceNow('h_fee');
    toast(`${bid.name}: fee ${rpk(mine)} masuk kantong. Jejak bertambah.`, '#ffd0a0');
  } else toast(`${p.name} dikerjakan ${bid.name} (${days} hari).`, '#cfe8ff');
  if (id === 'angkot') { if (flag('angkot_ditunda')) { mood('jaka', -25); haji(-4); note('Bang Jaka: "Janji tinggal janji, Nak." Para ojek kecewa.', 'warga'); } }
  if (rush) { mood('rani', -4); G.money -= rushCost(bid); d.jejak = clamp(d.jejak + 3, 0, 100); k.integ = clamp(k.integ - 4, 0, 100); }
  return true;
}
/** Jalan pintas (uji/otomatis): tender dengan penawar jujur, atau kroni bila markup = true. */
export function build(id, markup = false) {
  const c = city(); if (!canBuild(id)) { SFX.err(); return false; }
  const p = PROJECTS.find(x => x.id === id), bids = makeBids(id), bid = markup ? (bids.find(b => b.key === 'kroni') || bids.find(b => b.key === 'murah')) : (bids.find(b => b.key === 'jujur') || { key: 'jujur', name: NAMES.jujur[0], price: p.cost, quality: 90, rel: .9, fee: 0, dd: 0 });
  if (c.apbd < bid.price) { SFX.err(); return false; }
  return award(id, bid, false);
}
export const projectEffect = q => .5 + .5 * q / 100;
export function applyKotaFx(fx = {}) {
  const k = kota(), d = dn(), lines = [], sgn = n => (n > 0 ? '+' : '−') + Math.abs(n);
  if (fx.integ) { k.integ = clamp(k.integ + fx.integ, 0, 100); lines.push(`Integritas ${sgn(fx.integ)}`); }
  if (fx.duk) { k.duk += fx.duk; lines.push(`Dukungan ${sgn(fx.duk)}`); }
  if (fx.apbd && city()) { city().apbd = Math.max(0, city().apbd + fx.apbd); lines.push(`Kas kota ${fx.apbd > 0 ? '+' : '−'}${rpk(Math.abs(fx.apbd))}`); }
  if (fx.kota) { addInd(fx.kota); for (const key in fx.kota) lines.push(`${IND[key]} ${sgn(fx.kota[key])}`); }
  if (fx.jejak) { d.jejak = clamp(d.jejak + fx.jejak, 0, 100); lines.push(`Jejak korupsi ${sgn(fx.jejak)}`); }
  if (fx.sorotan) { d.sorotan = clamp(d.sorotan + fx.sorotan, 0, 100); lines.push(`Sorotan media ${sgn(fx.sorotan)}`); }
  if (fx.dprd) { d.dprd = clamp(d.dprd + fx.dprd, 0, 100); lines.push(`Dukungan DPRD ${sgn(fx.dprd)}`); }
  if (fx.harga) { d.harga = clamp(d.harga + fx.harga, .9, 1.6); lines.push(`Indeks harga ${sgn(Math.round(fx.harga * 100))}%`); }
  if (fx.saingan) { d.saingan += fx.saingan; lines.push(`Pelanggan berkurang ${fx.saingan} hari`); }
  if (fx.izin === 'cepat') { for (const id in k.ready) if (k.ready[id] > G.day) k.ready[id] = G.day; lines.push('Usaha buka lebih cepat'); }
  if (fx.returnFees) { if (d.fees > 0) mood('rani', 10); const f = d.fees; if (city()) city().apbd += f; G.money = Math.max(0, G.money - f); d.fees = 0; lines.push(`Fee dikembalikan ${rpk(f)}`); }
  if (fx.inspect && city()) { for (const p of city().proj) { if (fx.inspect === 'perbaiki') { p.quality = Math.min(95, p.quality + 20); p.left += 2; } else p.quality = Math.min(95, p.quality + 10); } lines.push(fx.inspect === 'perbaiki' ? 'Kualitas proyek naik, jadwal mundur' : 'Kontraktor disanksi'); }
  if (fx.warga) for (const id in fx.warga) { mood(id, fx.warga[id]); const w = WARGA.find(x => x.id === id); lines.push(`${w ? w.name : id} ${fx.warga[id] > 0 ? 'makin percaya' : 'kecewa'}`); }
  if (fx.haji) { haji(fx.haji); lines.push(fx.haji > 0 ? 'Pak Haji lega' : 'Pak Haji kecewa'); }
  if (fx.janji && city()) { k.janji = k.janji || {}; k.janji[fx.janji.who] = { proj: fx.janji.proj, due: city().day + 8 }; lines.push('Janji dicatat: 8 hari'); }
  if (fx.usaha === 'serahkan') { k.blind = true; lines.push('Dividen usaha ditahan sampai masa jabatan selesai'); }
  if (fx.usaha === 'kelola') { k.blind = false; setFlag('konflik_usaha'); lines.push('Pendapatan usaha tetap mengalir'); }
  if (fx.audit) resolveAudit(fx.audit, lines);
  return lines;
}
/** Hasil audit BPK: skor dari jejak korupsi + sorotan media; bisa berujung temuan, denda, penyelidikan KPK, atau penangkapan. */
export function resolveAudit(mode, lines = []) {
  const d = dn(), k = kota(); d.auditN++;
  let S = d.jejak + d.sorotan * .4 + ri(-8, 8); if (d.eproc) S *= .75; if (mode === 'pengacara') S *= .75;
  if (mode === 'sogok') { if (Math.random() < .35) { S = 100; lines.push('Auditor ternyata merekam suapmu!'); } else { S -= 30; d.jejak = clamp(d.jejak + 12, 0, 100); lines.push('Auditor menerima... jejak baru tercipta'); } }
  S = Math.round(S);
  if (S >= 75) { d.arrest = true; d.sorotan = clamp(d.sorotan + 30, 0, 100); lines.push('Temuan pidana! Kasus dilimpahkan ke KPK.'); }
  else if (S >= 50) { moodAll(-6); haji(-8); const pen = Math.round(d.fees * 1.5); G.money = Math.max(0, G.money - pen); d.sorotan = clamp(d.sorotan + 20, 0, 100); k.integ = clamp(k.integ - 10, 0, 100); addInd({ puas: -8 }); forceNow('d_kpk'); lines.push(`Temuan serius: denda ${rpk(pen)}, KPK akan memanggilmu.`); }
  else if (S >= 25) { const fine = Math.round(d.fees * .3); G.money = Math.max(0, G.money - fine); d.sorotan = clamp(d.sorotan + 5, 0, 100); k.integ = clamp(k.integ - 3, 0, 100); lines.push(`Temuan administrasi: denda ${rpk(fine)}.`); }
  else { k.integ = clamp(k.integ + 3, 0, 100); addInd({ puas: 2 }); lines.push('Opini WTP: tidak ada temuan berarti.'); }
  note(`Audit BPK ke-${d.auditN}: skor risiko ${S}.`, 'audit');
  return S;
}
/** Program antikorupsi: lelang terbuka (e-procurement) menutup celah fee/kroni; LHKPN melaporkan harta. */
export function setEproc() { const c = city(), d = dn(); if (!c || d.eproc || c.apbd < EPROC_COST) { SFX.err(); return false; } c.apbd -= EPROC_COST; d.eproc = true; k_integ(4); d.dprd = clamp(d.dprd - 5, 0, 100); SFX.good(); toast('Lelang terbuka diterapkan: tanpa fee, tanpa kroni.', '#cfe8ff'); return true; }
export function reportAssets() { const d = dn(); if (d.lhkpn) { SFX.err(); return false; } d.lhkpn = true; k_integ(3); d.sorotan = Math.max(0, d.sorotan - 5); SFX.good(); toast('LHKPN dilaporkan. Warga menilai kamu terbuka.', '#cfe8ff'); return true; }
const k_integ = n => { const k = kota(); k.integ = clamp(k.integ + n, 0, 100); };
/** Syarat tambahan kejadian dunia nyata (when). */
export function kotaWhenOk(w) {
  const d = dn(), c = city();
  if (w.jejakMin !== undefined && d.jejak < w.jejakMin) return false;
  if (w.jejakMax !== undefined && d.jejak > w.jejakMax) return false;
  if (w.dprdMax !== undefined && d.dprd > w.dprdMax) return false;
  if (w.hargaMin !== undefined && d.harga < w.hargaMin) return false;
  if (w.puasMax !== undefined && !(c && c.ind.puas <= w.puasMax)) return false;
  if (w.kerjaMax !== undefined && !(c && c.ind.kerja <= w.kerjaMax)) return false;
  if (w.bizMin !== undefined && Object.values(kota().biz).filter(v => v > 0).length < w.bizMin) return false;
  if (w.done && !(c && c.done[w.done] && !(c.broken && c.broken[w.done]))) return false;
  if (w.notDone && c && c.done[w.notDone] && !(c.broken && c.broken[w.notDone])) return false;
  if (w.proyekJalan && !(c && c.proj.length)) return false;
  if (w.wargaMin) for (const id in w.wargaMin) if (moodOf(id) < w.wargaMin[id]) return false;
  if (w.wargaMax) for (const id in w.wargaMax) if (moodOf(id) > w.wargaMax[id]) return false;
  if (w.feesMin !== undefined && d.fees < w.feesMin) return false;
  if (w.feesMax !== undefined && (d.feesEver || 0) > w.feesMax) return false;
  return true;
}
export function takeForcedEvent() { const d = G.kota && G.kota.dunia; if (d && d.force) { const f = d.force; d.force = (d.queue && d.queue.shift()) || null; return f; } return null; }
export function endingOf() {
  const k = kota(), avg = cityAvg(), c = city();
  if (dn().arrest) return 'tangkap';
  if (k.integ < 40 || dn().jejak >= 70) return 'korup';
  if (avg >= 54 && k.integ >= 70 && c.ind.puas >= 60) return 'bapak';
  return 'biasa';
}

/* ---------- awal hari ---------- */
/** Dipanggil saat hari baru dimulai (sebelum cerita dijadwalkan): buka babak, pendapatan usaha, kampanye, kota. */
export function dawnKota() {
  const k = kota(), s = st(), d = dn();
  if (!k.ch && s.ending) { k.ch = 6; k.phase = 'usaha'; setFlag('babak_usaha'); }
  if (!k.ch || k.lastDay === G.day) return;
  k.lastDay = G.day;
  if (d.arrest && !k.ending) { k.ending = 'tangkap'; ui.modal = 'kota_akhir'; SFX.down(); note('OTT KPK di rumah dinas pagi ini.', 'kpk'); return; }
  // ekonomi: harga bergerak, saingan reda, sorotan & jejak memudar pelan
  d.harga = clamp(d.harga + (1 - d.harga) * .02 + (Math.random() - .5) * .012, .9, 1.6); if (d.saingan > 0) d.saingan--;
  d.sorotan = Math.max(0, d.sorotan - 1.5); d.jejak = Math.max(0, d.jejak - .15);
  const inc = incomePerDay();
  if (k.blind && k.phase === 'wali' && G.day > 1) { k.held = (k.held || 0) + incomeGross(); }
  if (incomeNominal() > 0 && G.day > 1 && !(k.blind && k.phase === 'wali')) {
    G.money += inc; note(inc ? `Pendapatan usaha ${rpk(inc)}${d.saingan > 0 ? ' (ada saingan baru)' : ''}.` : 'Usaha belum menghasilkan: izin masih diproses.', 'usaha');
    if (incomeNominal() && d.harga > 1.12) note(`Harga naik ${Math.round((d.harga - 1) * 100)}%: margin usaha menipis.`, 'harga');
  }
  if (k.ch === 6 && isMiliarder()) { k.ch = 7; setFlag('miliarder'); note('Kekayaan bersihmu menembus Rp 1 miliar!'); }
  if (k.phase === 'kampanye') { k.camp.day++; if (k.camp.day >= CAMP_DAYS) runElection(); }
  else if (k.phase === 'wali' && k.city) cityDawn();
}
const setForce = id => { const d = dn(); if (!d.force) d.force = id; else if (d.force !== id && !d.queue.includes(id)) d.queue.push(id); };
const forceNow = id => { const d = dn(); if (d.force && d.force !== id) d.queue.unshift(d.force); d.force = id; };
function cityDawn() {
  const c = city(), k = kota(), d = dn(); c.broken = c.broken || {}; c.fail = c.fail || {}; c.qual = c.qual || {}; c.applied = c.applied || {};
  const tax = taxPerDay(); c.apbd += tax; c.taxToday = tax;
  if (c.talangan > 0) { const pay = Math.min(c.talangan, Math.round(tax * .4)); c.talangan -= pay; c.apbd -= pay; if (!c.talangan) note('Talangan kontraktor lunas dicicil dari pajak.', 'proyek'); }
  for (const key in c.ind) c.ind[key] = clamp(c.ind[key] - (key === 'bers' ? .25 : .15), 0, 100);
  c.ind.puas = clamp(c.ind.puas + ((c.ind.sej + c.ind.bers + c.ind.kerja) / 3 - 50) * .06, 0, 100);
  const rest = [];
  for (const p of c.proj) {
    // gangguan nyata di lapangan: molor karena cuaca/material, biaya membengkak (kontraktor kurang andal lebih sering)
    if (Math.random() < (1 - p.rel) * .35) { p.left++; note(`${PROJECTS.find(x => x.id === p.id).name} molor sehari (${p.who}: material terlambat).`, 'proyek'); }
    if (Math.random() < (1 - p.rel) * .12) { const extra = Math.round(p.price * (.08 + Math.random() * .12)); c.apbd = Math.max(0, c.apbd - extra); note(`Biaya ${PROJECTS.find(x => x.id === p.id).name} membengkak ${rpk(extra)} (addendum kontrak).`, 'proyek'); }
    p.left--; if (p.left > 0) { rest.push(p); continue; }
    const def = PROJECTS.find(x => x.id === p.id), m = projectEffect(p.quality); c.done[p.id] = true; c.qual[p.id] = p.quality; c.applied[p.id] = { fx: def.fx, m, fee: p.fee > 0 }; addInd(def.fx, m); SFX.good(); projectMoods(p.id, true);
    note(`${def.name} selesai (kualitas ${p.quality}, ${p.who}).`, 'proyek'); toast(`${def.name} selesai!`, '#ffe45c');
    if (p.quality < 55 && Math.random() < (60 - p.quality) / 55) c.fail[p.id] = c.day + ri(5, 14);
  }
  c.proj = rest; c.day++;
  // bangunan berkualitas buruk rusak: efeknya hilang, warga marah, penyelidikan mengendus fee
  for (const id of Object.keys(c.fail)) {
    if (c.day < c.fail[id]) continue; delete c.fail[id]; const ap = c.applied[id], def = PROJECTS.find(x => x.id === id);
    c.broken[id] = true; projectMoods(id, false); if (ap) addInd(ap.fx, -ap.m); addInd({ puas: -8 }); d.sorotan = clamp(d.sorotan + 15, 0, 100); d.jejak = clamp(d.jejak + (ap && ap.fee ? 10 : 4), 0, 100);
    note(`${def.name} RUSAK: kontraktor asal-asalan! Warga marah, media menyorot.`, 'rusak');
  }
  note(`Kas kota +${rpk(tax)}.`);
  if (d.jejak >= 85 && Math.random() < .5) { d.arrest = true; note('Penyidik sudah mengantongi bukti kuat.', 'kpk'); }
  // pemicu peristiwa: audit terjadwal, panggilan KPK, pelapor, demo, DPRD
  checkJanji();
  if (AUDIT_DAYS.includes(c.day)) setForce('d_audit');
  else if (c.day === d.kpkDay) setForce('d_kpk');
  else if (c.day === 2 && Object.values(k.biz).some(v => v > 0)) setForce('w_usaha');
  else if (c.day === 12) setForce('h_sakit');
  else if (HAJI_DAYS.includes(c.day)) setForce(hajiCall());
  else if (c.day % 3 === 1 && nextWargaEvent()) setForce(nextWargaEvent());
  else {
    const pw = d.jejak > 20 ? d.sorotan / 500 + (100 - c.ind.puas) / 2000 + d.jejak / 1500 : 0;
    if (Math.random() < pw) setForce('d_whistle');
    else if (c.ind.puas < 35 && Math.random() < .35) setForce('d_demo');
    else if (d.dprd < DPRD_MIN && c.day % 5 === 0) setForce('d_jatah');
  }
  if (c.day > CITY_DAYS && !k.ending) { k.ending = endingOf(); ui.modal = 'kota_akhir'; SFX.ending(); if (k.held) { G.money += k.held; note(`Dividen usaha yang ditahan selama menjabat cair: ${rpk(k.held)}.`, 'usaha'); k.held = 0; } }
}
/* ---------- warga lama & Pak Haji ---------- */
export function initWarga() {
  const k = kota(), regs = (st().regs) || {}; k.warga = {}; k.janji = {}; k.wargaSeen = [];
  for (const w of WARGA) k.warga[w.id] = clamp(Math.round(40 + ((regs[w.id] && regs[w.id].aff) || 30) * .4), 30, 85);
  k.haji = clamp(Math.round(30 + k.integ * .5), 30, 85);
}
export const moodOf = id => { const k = kota(); return k.warga && k.warga[id] !== undefined ? k.warga[id] : 50; };
function mood(id, n) { const k = kota(); if (!k.warga) return; if (k.warga[id] !== undefined) k.warga[id] = clamp(k.warga[id] + n, 0, 100); }
function moodAll(n) { for (const w of WARGA) mood(w.id, n); }
function haji(n) { const k = kota(); if (k.haji !== undefined) k.haji = clamp(k.haji + n, 0, 100); }
export const hajiOf = () => (kota().haji !== undefined ? kota().haji : 60);
/** Proyek selesai (ok) atau rusak: warga yang membutuhkannya paling merasakan. */
function projectMoods(id, ok) {
  for (const w of WARGA) {
    if (w.wants.includes(id)) mood(w.id, ok ? 14 : -15);
    else if (w.fears && w.fears.includes(id)) mood(w.id, ok ? (flag('ojek_dilibatkan') ? 6 : -12) : 0);
    else if (!ok) mood(w.id, -5);
  }
  const fan = WARGA.find(w => w.wants.includes(id));
  if (fan && ok) note(`${fan.name}: "${TALK[fan.id].got}"`, 'warga');
}
function checkJanji() {
  const k = kota(), c = city(); if (!k.janji) return;
  for (const who of Object.keys(k.janji)) {
    const j = k.janji[who], w = WARGA.find(x => x.id === who);
    if (c.done[j.proj] && !(c.broken && c.broken[j.proj])) { mood(who, 6); haji(2); note(`${w.name}: janjimu ditepati.`, 'warga'); delete k.janji[who]; }
    else if (c.day > j.due) { mood(who, -20); haji(-5); note(`${w.name}: "Janji tinggal janji." Kekecewaannya menyebar di kampung.`, 'warga'); addInd({ puas: -2 }); delete k.janji[who]; }
  }
}
/** Nada telepon Pak Haji mengikuti integritas, fee, dan jejak. */
export function hajiCall() { const k = kota(), d = dn(); return d.jejak >= 40 || k.integ < 50 ? 'h_kecewa' : d.feesEver > 0 || k.integ < 70 ? 'h_ragu' : 'h_baik'; }
/** Warga lama berikutnya yang datang ke balai kota (sekali per kejadian, bila syaratnya terpenuhi). */
export function nextWargaEvent() {
  const k = kota(), seen = k.wargaSeen || (k.wargaSeen = []);
  const e = WARGA_POOL.find(ev => ev.warga && !seen.includes(ev.id) && kotaWhenOk(ev.when || {}) && [].concat(ev.when.phase || []).every(ph => ph === k.phase));
  return e ? e.id : null;
}
export function markWargaSeen(id) { const k = kota(); if (WARGA_POOL.some(e => e.id === id && e.warga)) (k.wargaSeen || (k.wargaSeen = [])).push(id); }
/** Ucapan pembeli di warung tentang kota: warga lama bicara soal kebutuhannya, pembeli lain soal kabar kota. */
export function cityTalk(regId) {
  const k = G.kota; if (!k || k.phase !== 'wali' || !k.city) return null; const c = k.city, d = k.dunia || {};
  const w = WARGA.find(x => x.id === regId);
  if (w) { const m = moodOf(w.id), got = w.wants.some(x => c.done[x] && !(c.broken && c.broken[x])); return m < 35 ? TALK[w.id].sad : got ? TALK[w.id].got : TALK[w.id].need; }
  const pickOf = a => a[Math.floor(Math.random() * a.length)];
  if (d.jejak >= 35) return pickOf(CITY_TALK.jejak);
  if (c.broken && Object.values(c.broken).some(Boolean)) return pickOf(CITY_TALK.rusak);
  if (d.harga >= 1.08) return pickOf(CITY_TALK.harga);
  if (c.ind.bers < 35) return pickOf(CITY_TALK.kotor);
  if (c.done.taman && Math.random() < .5) return pickOf(CITY_TALK.taman);
  if (c.ind.puas >= 65) return pickOf(CITY_TALK.bagus);
  return null;
}
/** "Korban" sebuah tawaran tender: uang warga yang hilang dibandingkan dengan hal nyata. */
export function victimOf(bid, def) {
  const over = Math.max(0, bid.price - def.cost) + (bid.key === 'murah' ? bid.fee : 0), fan = WARGA.find(w => w.wants.includes(def.id));
  if (bid.key === 'murah') return `Kualitas rendah: kalau rusak, ${fan ? fan.name : 'warga'} yang menanggung. Fee-nya diambil dari mutu bangunan.`;
  if (!over) return '';
  return `${rpk(over)} uang warga = ${Math.floor(over / BEASISWA)} beasiswa seperti Rani, atau ${Math.floor(over / JALAN_M)} m jalan gang Bu Sri.`;
}
/** Kalimat penutup per tokoh untuk akhir masa jabatan. */
export function epilogPeople() {
  const k = kota(), out = [], h = hajiOf();
  out.push(h >= 65 ? EPI.haji.hi : h >= 40 ? EPI.haji.mid : EPI.haji.lo);
  for (const w of WARGA) { const m = moodOf(w.id); if (m >= 65) out.push(EPI[w.id].hi); else if (m <= 35) out.push(EPI[w.id].lo); }
  return k.warga ? out : out.slice(0, 1);
}
export const BANTU_COST = 10e6, BANTU_CD = 3;
export const canBantu = id => { const k = kota(); return k.phase === 'wali' && !!k.warga && G.money >= BANTU_COST && G.day - ((k.bantu && k.bantu[id]) || -99) >= BANTU_CD; };
/** Bantu warga dari kantong pribadi: menolong secara nyata, tapi uangnya bisa saja berasal dari fee. */
export function bantuWarga(id) {
  const k = kota(), w = WARGA.find(x => x.id === id); if (!w || !canBantu(id)) { SFX.err(); return false; }
  G.money -= BANTU_COST; (k.bantu || (k.bantu = {}))[id] = G.day; mood(id, 8); SFX.coin();
  note(`Kamu membantu ${w.name} diam-diam ${rpk(BANTU_COST)}.${dn().fees > 0 ? ' Uangnya dari mana, tidak ada yang bertanya.' : ''}`, 'warga');
  toast(`${w.name} terbantu. Suasana hatinya membaik.`, '#cfe8ff'); return true;
}
export const wargaList = () => WARGA.map(w => ({ ...w, mood: moodOf(w.id), janji: kota().janji && kota().janji[w.id], talk: cityTalk(w.id) }));
export const endingInfo = () => (kota().ending === 'tangkap' ? ENDING_ARREST : ENDINGS[kota().ending]) || null;
