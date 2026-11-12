import { SFX } from '../audio.js';
import { G } from '../state.js';
import { rp, clamp } from '../util.js';
import { flt, toast } from '../widgets.js';
import { checkAchievements } from './achievements.js';
import { addXp, level } from './level.js';
import { changeTrust, repayChance, story } from './story.js';

/* ============================================================
   DAFTAR KASBON & PENAGIHAN
   - Batas kasbon beredar naik seiring level (80rb + 30rb × level).
   - Tiap catatan bisa ditagih sekali sehari: halus (aman, peluang sedang) atau keras (peluang tinggi, merusak kepercayaan).
   - Bisa juga diikhlaskan (hapus catatan, kepercayaan naik).
   - Kasbon yang tidak ditagih tetap bisa dibayar sendiri tiap pagi (lihat logic/day.js) atau macet setelah 3 hari.
   ============================================================ */
export const outstanding = () => G.debts.reduce((s, d) => s + d.amount, 0);
export const kasbonLimit = () => 80000 + 30000 * level();
export const ageOf = d => G.day - d.day;
/** Bisa dianggap macet pagi besok (umur ≥ 2 hari). */
export const overdue = d => ageOf(d) >= 2;
export const askedToday = d => d.askedDay === G.day;
/** Peluang tagih sekarang: halus ≈ 25–52%, keras ≈ 60–95% (naik dengan umur kasbon & kepercayaan warga). */
export function chances(d) {
  const base = repayChance(), age = Math.max(0, ageOf(d));
  return { soft: clamp(base * .55 + Math.min(.2, age * .07), 0, .9), hard: clamp(base + .15 + age * .05, 0, .95) };
}

function remove(d) { const i = G.debts.indexOf(d); if (i >= 0) G.debts.splice(i, 1); }

/** Tagih sekarang. Hasil: { ok, text }. */
export function collect(d, hard = false) {
  if (!G.debts.includes(d) || askedToday(d)) return { ok: false, text: 'Sudah ditagih hari ini.' };
  d.askedDay = G.day;
  const p = hard ? chances(d).hard : chances(d).soft, ok = Math.random() < p;
  const s = story(); s.collectCount = (s.collectCount || 0) + (ok && !hard ? 1 : 0);
  if (!hard) G.energy = Math.max(0, G.energy - 2);
  let text;
  if (ok) {
    remove(d); G.money += d.amount; if (G.stats) G.stats.kasbonPaid += d.amount; SFX.coin(); flt('+' + rp(d.amount), 640, 300, '#9dff8c');
    changeTrust(hard ? -1 : .5);
    text = hard ? `${d.who} membayar ${rp(d.amount)} dengan wajah masam.` : `${d.who} membayar ${rp(d.amount)}. "Maaf ya, lupa!"`;
  } else {
    if (hard) { changeTrust(-2); G.rep = clamp(G.rep - 1, 0, 100); SFX.err(); text = `${d.who} tersinggung ditagih keras dan belum membayar.`; }
    else { SFX.click(); text = `${d.who} berjanji akan membayar nanti.`; }
  }
  toast(text, ok ? '#9dff8c' : '#ffd0d0'); checkAchievements();
  return { ok, text };
}
/** Ikhlaskan: hapus catatan, kepercayaan naik. */
export function forgive(d) {
  if (!G.debts.includes(d)) return;
  remove(d); changeTrust(1.5); addXp(5); SFX.good();
  toast(`Kamu mengikhlaskan kasbon ${d.who} ${rp(d.amount)}.`, '#cfe8ff');
}
