import { SFX } from '../audio.js';
import { BY } from '../data.js';
import { G, ui } from '../state.js';
import { rp, clamp, pick, rnd } from '../util.js';
import { flt, toast } from '../widgets.js';
import { checkAchievements } from './achievements.js';
import { bondByName } from './regulars.js';
import { CATATAN, CHAPTERS, EPILOG, EPILOG_FLAG, POOL, SCRIPT } from '../story/events.js';
import { addXp, level } from './level.js';

/* ============================================================
   MESIN CERITA & TANGGUNG JAWAB
   Utang cicilan ke Koh Awi, Kepercayaan warga, kejadian harian dengan pilihan, kabar kampung.
   Konten (bab, kejadian, pilihan) ada di story/events.js — di sini hanya mesinnya.
   ============================================================ */
export const DEBT0 = 1200000;       // utang modal awal
export const CYCLE = 3;             // cicilan tiap 3 hari
const INSTALL = [90000, 130000, 170000, 200000, 220000];   // cicilan per bab
const INTEREST = .05;               // bunga tunggakan

export function initStory(day = 1) {
  return { debt: DEBT0, due: day + CYCLE, arrears: 0, hold: 0, trust: 50, easy: false, lunas: false,
    done: [], recent: [], flags: {}, queue: [], kabar: [], cur: null, result: null, lastPay: null, ending: null, chapterSeen: 0, paidCount: 0, collectCount: 0, freshStreak: 0, regs: {}, ach: {} };
}
export const story = () => G.story || (G.story = initStory(G.day || 1));

/** Bab sedang berjalan menurut level: 1 (Lv1–2), 2 (Lv3–4), 3 (Lv5–6), 4 (Lv7), 5 (Lv8+). */
export const chapterOf = (L = level()) => L <= 2 ? 1 : L <= 4 ? 2 : L <= 6 ? 3 : L === 7 ? 4 : 5;
export const chapterName = (c = chapterOf()) => CHAPTERS[c - 1];
export const catatan = (c = chapterOf()) => CATATAN[c - 1];
export const installment = () => Math.min(INSTALL[chapterOf() - 1], story().debt);

/* ---------- Kepercayaan warga ---------- */
export const trust = () => story().trust;
export function changeTrust(n) {
  const s = story(), before = s.trust; s.trust = clamp(Math.round((s.trust + n) * 10) / 10, 0, 100);
  const d = s.trust - before; if (Math.abs(d) >= 1) flt(`Percaya ${d > 0 ? '+' : '−'}${Math.round(Math.abs(d))}`, 800, 84, d > 0 ? '#9dd0ff' : '#ff9a8a');
}
/** Pengali kesabaran pembeli: 0,88 (percaya 0) … 1,12 (percaya 100). */
export const trustMul = () => 1 + (trust() - 50) / 50 * .12;
/** Peluang kasbon dilunasi esok hari: 45% (percaya 0) … 85% (percaya 100); 65% pada 50. */
export const repayChance = () => .45 + .4 * trust() / 100;

/* ---------- Utang & cicilan ---------- */
/** Pesanan ke grosir ditahan karena tunggakan. */
export const orderBlocked = () => !story().easy && !story().lunas && story().hold >= G.day;

/** Dipanggil saat warung tutup. Menghasilkan story.lastPay (dipakai rekap malam). */
export function settleInstallment() {
  const s = story(); s.lastPay = null;
  if (s.easy || s.lunas || G.day < s.due) return;
  const amt = installment();
  if (G.money >= amt) {
    G.money -= amt; s.debt -= amt; s.arrears = 0; s.due = G.day + CYCLE; s.hold = 0; s.paidCount = (s.paidCount || 0) + 1;
    s.lastPay = { ok: true, amount: amt };
    if (s.debt <= 0) { s.debt = 0; s.lunas = true; s.lastPay.lunas = true; changeTrust(5); SFX.good(); toast('UTANG LUNAS! Koh Awi menyalami tanganmu.', '#ffe45c'); s.kabar.push('Utang ke Koh Awi lunas. Warga ikut senang.'); }
    else toast(`Cicilan ${rp(amt)} dibayar. Sisa utang ${rp(s.debt)}.`, '#cfe8ff');
  } else {
    s.arrears++; const pen = Math.round(s.debt * INTEREST); s.debt += pen; s.due = G.day + 1; changeTrust(-3);
    if (s.arrears >= 2) s.hold = G.day + (s.arrears >= 3 ? 2 : 1);
    s.lastPay = { ok: false, amount: amt, penalty: pen, hold: s.hold >= G.day + 1 };
    SFX.err(); toast(`Cicilan ${rp(amt)} menunggak! Bunga ${rp(pen)}.`, '#ffd0d0');
    s.kabar.push(s.hold >= G.day + 1 ? 'Koh Awi menahan pesananmu besok sampai cicilan beres.' : 'Koh Awi menelepon: cicilan menunggak.');
  }
}

/** Bayar utang lebih awal (kapan saja, kelipatan Rp 50.000). Mengurangi sisa utang, bukan jadwal cicilan. */
export function payDebt(n = 50000) {
  const s = story(); if (s.lunas || s.debt <= 0) return false;
  const amt = Math.min(n, s.debt); if (G.money < amt) { SFX.err(); return false; }
  G.money -= amt; s.debt -= amt; SFX.coin();
  if (s.debt <= 0) { s.debt = 0; s.lunas = true; changeTrust(5); SFX.good(); toast('UTANG LUNAS! Koh Awi menyalami tanganmu.', '#ffe45c'); s.kabar.push('Utang ke Koh Awi lunas. Warga ikut senang.'); checkAchievements(); }
  else toast(`Bayar ${rp(amt)} ke Koh Awi. Sisa utang ${rp(s.debt)}.`, '#cfe8ff');
  return true;
}

/* ---------- Penerapan efek ---------- */
export function applyFx(fx = {}) {
  const lines = [];
  if (fx.money) { G.money = Math.max(0, G.money + fx.money); lines.push(`${fx.money > 0 ? '+' : '−'}${rp(Math.abs(fx.money))}`); }
  if (fx.trust) { changeTrust(fx.trust); lines.push(`Kepercayaan ${fx.trust > 0 ? '+' : '−'}${Math.abs(fx.trust)}`); }
  if (fx.rep) { G.rep = clamp(G.rep + fx.rep, 0, 100); lines.push(`Reputasi ${fx.rep > 0 ? '+' : '−'}${Math.abs(fx.rep)}`); }
  if (fx.energy) { G.energy = clamp(G.energy + fx.energy, 0, 100); lines.push(`Energi ${fx.energy > 0 ? '+' : '−'}${Math.abs(fx.energy)}`); }
  if (fx.stock) for (const id in fx.stock) { G.stock[id] = Math.max(0, (G.stock[id] || 0) + fx.stock[id]); lines.push(`${BY[id].name} ${fx.stock[id] > 0 ? '+' : '−'}${Math.abs(fx.stock[id])}`); }
  if (fx.debt) { story().debt = Math.max(0, story().debt + fx.debt); lines.push(`Utang ${fx.debt > 0 ? '+' : '−'}${rp(Math.abs(fx.debt))}`); }
  if (fx.dueShift) { story().due += fx.dueShift; lines.push(`Cicilan mundur ${fx.dueShift} hari`); }
  if (fx.kasbon) { G.debts.push({ who: fx.kasbon.who, amount: fx.kasbon.amount, day: G.day }); lines.push(`Kasbon ${fx.kasbon.who} ${rp(fx.kasbon.amount)}`); }
  if (fx.bond) for (const b of [].concat(fx.bond)) { bondByName(b.who, b.n); lines.push(`${b.who} ${b.n > 0 ? 'lebih dekat' : 'menjauh'}`); }
  if (fx.flag) story().flags[fx.flag] = true;
  if (fx.xp) addXp(fx.xp);
  return lines;
}

/* ---------- Kejadian harian ---------- */
const ALL = [...SCRIPT, ...POOL];
export const eventById = id => ALL.find(e => e.id === id) || null;

/** Syarat tampil suatu kejadian (when): lunas, flag, noFlag, trustMin, trustMax. */
export function eligible(ev) {
  const w = ev.when; if (!w) return true; const s = story();
  if (w.lunas !== undefined && !!s.lunas !== w.lunas) return false;
  if (w.flag && !s.flags[w.flag]) return false;
  if (w.noFlag && s.flags[w.noFlag]) return false;
  if (w.trustMin !== undefined && s.trust < w.trustMin) return false;
  if (w.trustMax !== undefined && s.trust > w.trustMax) return false;
  return true;
}
/** Pilih kejadian hari ini: urutan bab dulu (yang syaratnya terpenuhi), lalu kolam acak (tanpa ulang dalam 8 terakhir). */
export function pickEvent() {
  const s = story(), ch = chapterOf(), L = level();
  const scripted = SCRIPT.find(e => e.ch <= ch && !s.done.includes(e.id) && eligible(e));
  if (scripted) return scripted;
  const pool = POOL.filter(e => e.minLevel <= L && !s.recent.includes(e.id) && eligible(e));
  return pool.length ? pick(pool) : null;
}
/** Kartu pembuka bab: tampil sekali saat bab baru dimulai (setelah warung dibuka). */
export function openChapterIntro() { const s = story(); s.chapterSeen = chapterOf(); ui.modal = 'bab'; SFX.chapter(); }
/** Jadwalkan satu kejadian cerita hari ini; kejadian malam muncul sekitar tengah malam. */
export function scheduleStory(events) {
  if (chapterOf() > story().chapterSeen) events.push({ k: 'bab', t: 6.05, done: false });
  const ev = pickEvent(); if (!ev) return;
  events.push({ k: 'story', id: ev.id, t: ev.night ? rnd(23.2, 24.8) : rnd(11, 19), done: false });
}

/** Buka dialog kejadian (dipanggil saat waktunya & tidak sedang melayani). */
export function openStoryEvent(id) {
  const ev = (id && eventById(id)) || pickEvent(); if (!ev) return false;
  const s = story(); s.cur = ev.id; s.result = null; ui.modal = 'event'; SFX.bell(); return true;
}
export const currentEvent = () => eventById(story().cur);
export function choiceOk(c) {
  const r = c.req; if (!r) return true;
  if (r.money && G.money < r.money) return false;
  if (r.stock) for (const id in r.stock) if ((G.stock[id] || 0) < r.stock[id]) return false;
  return true;
}
export function chooseEvent(i) {
  const s = story(), ev = currentEvent(); if (!ev || s.result) return;
  const c = ev.choices[i]; if (!c || !choiceOk(c)) { SFX.err(); return; }
  const lines = applyFx(c.fx);
  (c.later || []).forEach(l => s.queue.push({ day: G.day + l.days, ...l }));
  s.result = { text: c.res, lines }; s.kabar.push(c.res);
  if (c.fx && c.fx.trust) (c.fx.trust > 0 ? SFX.up : SFX.down)(); else SFX.click();
  if (SCRIPT.includes(ev)) { s.done.push(ev.id); if (ev.group) SCRIPT.filter(e => e.group === ev.group).forEach(e => { if (!s.done.includes(e.id)) s.done.push(e.id); }); }
  if (ev.final) s.ending = endingId();
  s.recent.push(ev.id); if (s.recent.length > 8) s.recent.shift();
  checkAchievements();
}
/** Epilog menurut keadaan akhir: dipercaya / untung / bertahan. */
export function endingId() {
  const s = story();
  if (s.trust >= 60 && s.lunas) return 'dipercaya';
  if (s.trust < 45 && G.money >= 500000) return 'untung';
  return 'bertahan';
}
export function epilog() {
  const s = story(), id = s.ending; if (!id) return null;
  const lines = [EPILOG[id].text];
  for (const f of ['cabang', 'layanan', 'koperasi']) if (s.flags[f]) lines.push(EPILOG_FLAG[f]);
  lines.push(s.lunas ? 'Utang ke Koh Awi: lunas.' : `Utang ke Koh Awi masih tersisa ${rp(s.debt)}.`);
  return { title: EPILOG[id].title, lines, id };
}
export function closeStoryEvent() {
  const s = story(), ev = currentEvent(); s.cur = null; s.result = null;
  if (ui.modal === 'event') { ui.modal = ev && ev.final && s.ending ? 'epilog' : null; if (ui.modal === 'epilog') SFX.ending(); }
}

/** Awal hari: terapkan kabar lanjutan yang jatuh tempo dan kosongkan kabar kemarin. */
export function dawnStory() {
  const s = story(); s.kabar = []; s.lastPay = null;
  const rest = [];
  for (const q of s.queue) {
    if (q.day > G.day) { rest.push(q); continue; }
    const good = q.chance === undefined || Math.random() < q.chance;
    const text = good ? q.text : q.elseText, fx = good ? q.fx : q.elseFx;
    if (text) { applyFx(fx); s.kabar.push(text); G.morning.push(text); }
  }
  s.queue = rest;
}
