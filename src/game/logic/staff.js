import { SFX } from '../audio.js';
import { ITEMS } from '../data.js';
import { G } from '../state.js';
import { clamp, rp } from '../util.js';
import { toast } from '../widgets.js';
import { REGULARS, ROLES } from '../story/regulars.js';
import { checkAchievements } from './achievements.js';
import { packPrice, placeOrder } from './actions.js';
import { ageOf, chances } from './kasbon.js';
import { featureOn, itemOn, level, typeOn } from './level.js';
import { bond, hasRole, regById, regTier } from './regulars.js';
import { changeTrust, orderBlocked, story } from './story.js';

/* ============================================================
   KARYAWAN (Lv 7+): direkrut dari pelanggan tetap yang sudah Akrab. Tiap tokoh punya satu peran (lihat ROLES).
   - Kursi: 1 karyawan mulai Level 7, 2 mulai Level 10.
   - Gaji harian dibayar saat warung tutup (sebelum cicilan Koh Awi). Gagal bayar → gaji menumpuk, kesetiaan −15; kesetiaan ≤ 0 → berhenti.
   - Kesetiaan < 30 → karyawan malas (perannya tidak aktif). Bonus Rp 50.000 menaikkan kesetiaan.
   ============================================================ */
export const BONUS_COST = 50000;
export const slots = () => (!featureOn('karyawan') ? 0 : level() >= 10 ? 2 : 1);
export const staffList = () => { const s = story(); s.staff = s.staff || []; return s.staff; };
export const isHired = id => staffList().some(e => e.id === id);
export const wageOf = id => { const r = regById(id); return r && r.job ? ROLES[r.job].wage : 0; };
export const wagesPerDay = () => staffList().reduce((q, e) => q + wageOf(e.id), 0);
/** Tokoh yang bisa direkrut sekarang: punya peran, sudah Akrab, tipenya terbuka, belum bekerja. */
export const candidates = () => REGULARS.filter(r => r.job && typeOn(r.type) && regTier(r.id) >= 2 && !isHired(r.id));
export const canHire = id => { const r = regById(id); return !!r && !!r.job && staffList().length < slots() && !isHired(id) && regTier(id) >= 2 && typeOn(r.type); };

export function hire(id) {
  if (!canHire(id)) { SFX.err(); return false; }
  const r = regById(id); staffList().push({ id, loyalty: 60, since: G.day, owed: 0 }); story().flags.hired = true;
  bond(id, 3); SFX.good(); toast(`${r.name} kini bekerja sebagai ${ROLES[r.job].name}!`, '#ffe45c'); story().kabar.push(`${r.name} mulai bekerja di warungmu.`); checkAchievements(); return true;
}
function leave(id) { const l = staffList(), i = l.findIndex(e => e.id === id); if (i >= 0) l.splice(i, 1); }
export function fire(id) {
  const r = regById(id); if (!r || !isHired(id)) return; leave(id); bond(id, -6); changeTrust(-1); SFX.err();
  toast(`${r.name} diberhentikan.`, '#ffd0d0'); story().kabar.push(`${r.name} diberhentikan.`);
}
export function giveBonus(id) {
  const e = staffList().find(x => x.id === id); if (!e) return false;
  if (G.money < BONUS_COST) { SFX.err(); toast(`Uang kurang untuk bonus (${rp(BONUS_COST)}).`, '#ffd0d0'); return false; }
  G.money -= BONUS_COST; if (G.stats) G.stats.spent += BONUS_COST; e.loyalty = clamp(e.loyalty + 15, 0, 100); bond(id, 3); SFX.coin();
  toast(`Bonus ${rp(BONUS_COST)} untuk ${regById(id).name}.`, '#9dff8c'); checkAchievements(); return true;
}

/** Saat warung tutup: bayar gaji (termasuk tunggakan). Mengembalikan ringkasan. */
export function payWages() {
  const out = { paid: 0, unpaid: [], quit: [] }, s = story();
  for (const e of [...staffList()]) {
    const r = regById(e.id), due = wageOf(e.id) + (e.owed || 0);
    if (G.money >= due) { G.money -= due; e.owed = 0; e.loyalty = clamp(e.loyalty + 1, 0, 100); out.paid += due; if (G.stats) G.stats.spent += due; }
    else {
      e.owed = due; e.loyalty = clamp(e.loyalty - 15, 0, 100); out.unpaid.push(r.name);
      if (e.loyalty <= 0) { leave(e.id); bond(e.id, -8); changeTrust(-3); out.quit.push(r.name); s.kabar.push(`${r.name} berhenti karena gaji tidak dibayar.`); SFX.err(); }
      else s.kabar.push(`Gaji ${r.name} belum dibayar (kesetiaan turun).`);
    }
  }
  if (out.paid) { toast(`Gaji karyawan ${rp(out.paid)} dibayar.`, '#cfe8ff'); s.kabar.push(`Gaji karyawan ${rp(out.paid)} dibayar.`); }
  return out;
}

/** Pagi hari: tugas otomatis penagih dan admin stok. */
export function dawnStaff() {
  if (hasRole('penagih')) {
    for (const d of [...G.debts]) {
      if (ageOf(d) < 1) continue;
      if (Math.random() < Math.min(.9, chances(d).soft + .15)) {
        const i = G.debts.indexOf(d); if (i >= 0) G.debts.splice(i, 1); G.money += d.amount; if (G.stats) G.stats.kasbonPaid += d.amount; changeTrust(.5);
        G.morning.push(`${d.who} membayar kasbon ${rp(d.amount)} setelah ditagih karyawanmu`);
      }
    }
  }
  if (hasRole('admin') && !orderBlocked()) {
    const pending = {}; for (const d of G.deliveries) for (const id in d.items) pending[id] = (pending[id] || 0) + d.items[id];
    const budget = G.money * .3, cart = {}; let cost = 0;
    for (const it of ITEMS) {
      if (!itemOn(it.id) || (G.stock[it.id] || 0) + (pending[it.id] || 0) >= 4) continue;
      const c = packPrice(it); if (cost + c <= budget) { cart[it.id] = 1; cost += c; }
    }
    if (Object.keys(cart).length) {
      const keepOrder = G.lastOrder, keepCart = G.cart; G.cart = cart; placeOrder(); G.lastOrder = keepOrder; G.cart = keepCart;
      G.morning.push(`Admin stok memesan ${Object.keys(cart).length} jenis barang (${rp(cost)})`);
    }
  }
}
