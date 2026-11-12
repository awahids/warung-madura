import { SFX } from '../audio.js';
import { DAY_START } from '../constants.js';
import { BY } from '../data.js';
import { returnTray, sendAway } from './customers.js';
import { featureOn, itemOn, typeOn } from './level.js';
import { checkAchievements } from './achievements.js';
import { changeTrust, dawnStory, repayChance, scheduleStory, settleInstallment } from './story.js';
import { save } from '../persist.js';
import { G, ui } from '../state.js';
import { clamp, pick, ri, rnd, rp } from '../util.js';
import { toast } from '../widgets.js';

/* ============================================================
   LOGIKA GAME
   ============================================================ */
export function startDay(loaded) {
  G.abs = (G.day - 1) * 1440 + DAY_START * 60; G.h = DAY_START; G.energy = 100;
  G.door = 0; G.doorState = 'closed'; G.running = false; G.closing = false;
  G.cust = []; G.leaving = []; G.tray = {}; G.promo = false; G.spawnCd = 3; G.idle = 0; G.cart = {};
  G.rain = Math.random() < .32 ? { from: rnd(8, 17), len: rnd(1.5, 3.2) } : null;
  G.stats = { xp: 0, served: 0, revenue: 0, profit: 0, spent: 0, tips: 0, left: 0, sold: {}, kasbonNew: 0, kasbonPaid: 0, bonus: 0 };
  G.missions = genMissions();
  G.events = [];
  if (featureOn('kasbon')) G.events.push({ k: 'kasbon', t: rnd(10, 21), done: false });
  if (typeOn('hoodie') && (G.day >= 2 || Math.random() < .5)) G.events.push({ k: 'mystery', t: rnd(23.3, 24.8), done: false });
  scheduleStory(G.events);
  // kasbon pagi
  G.morning = [];
  if (G.day > 1 && !loaded) {
    const keep = [];
    for (const d of G.debts) {
      const age = G.day - d.day;
      if (Math.random() < repayChance()) { G.money += d.amount; changeTrust(.5); G.stats.kasbonPaid += d.amount; G.morning.push(`${d.who} bayar kasbon ${rp(d.amount)}`); }
      else if (age >= 3) { changeTrust(-1); G.morning.push(`Kasbon ${d.who} ${rp(d.amount)} macet — diikhlaskan`); }
      else keep.push(d);
    }
    G.debts = keep;
  }
  dawnStory();
  save();
}
export function genMissions() {
  const n = clamp(4 + Math.floor(G.day * 1.2), 5, 12);
  const itemPool = ['kopi', 'rokok', 'aqua', 'mie', 'bensin', 'kerupuk', 'snack', 'cola'].filter(itemOn);
  const id = pick(itemPool), cnt = id === 'bensin' ? ri(2, 4) : ri(4, 8);
  const rev = Math.round((120000 + G.day * 25000) / 10000) * 10000;
  return [
    { text: `Layani ${n} pelanggan`, key: 'served', target: n, done: false },
    { text: `Jual ${cnt} ${BY[id].name}`, key: 'sold:' + id, target: cnt, done: false },
    { text: `Omzet ${rp(rev)}`, key: 'revenue', target: rev, done: false },
  ];
}
export function missionVal(m) {
  if (m.key === 'served') return G.stats.served;
  if (m.key === 'revenue') return G.stats.revenue;
  return G.stats.sold[m.key.split(':')[1]] || 0;
}

export function isRain() { return !!G.rain && G.h >= G.rain.from && G.h < G.rain.from + G.rain.len; }

/* ---- siklus hari ---- */
export function openShop() { G.doorState = 'open'; G.door = 1; G.running = true; SFX.good(); toast('Warung BUKA! Selamat berjualan, Juragan.', '#ffe45c'); G.morning.forEach(m => toast(m, '#cfe8ff')); }
export function endDay(reason) {
  if (G.closing) return; G.closing = true; G.running = false; G.endReason = reason;
  returnTray();
  for (const c of [...G.cust]) { c.bye = 'Yah, udah tutup...'; sendAway(c); }
  G.doorState = 'closing'; SFX.door();
  if (reason === 'faint') { G.money = Math.max(0, G.money - 15000); G.stats.spent += 15000; }
}
export function finishClose() {
  G.doorState = 'closed'; G.door = 0; G.bonusMissions = 0;
  settleInstallment(); checkAchievements();
  for (const m of G.missions) if (missionVal(m) >= m.target) { G.bonusMissions++; }
  G.stats.bonus = G.bonusMissions * 20000; G.money += G.stats.bonus;
  ui.modal = 'summary'; save();
}
export function nextDay() { G.day++; ui.modal = null; startDay(); }

